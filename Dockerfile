# ─── Stage 1: Build (install heavy deps inside venv) ────────────────────────
FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# System dependencies
# python3.12 is not in the default Ubuntu 22.04 repos – add deadsnakes PPA first
RUN apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
        curl \
    && add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
        python3.12 \
        python3.12-dev \
        python3.12-venv \
        python3-pip \
        build-essential \
        cmake \
        ninja-build \
        git \
        ffmpeg \
        libsm6 \
        libxext6 \
        libgl1 \
        libglib2.0-0 \
        libsndfile1 \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create virtual environment
RUN python3.12 -m venv $VIRTUAL_ENV

# Upgrade pip inside venv
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch with CUDA 12.8 first (large wheels, cached separately)
RUN pip install --no-cache-dir \
        torch==2.9.1 \
        torchvision==0.24.1 \
        torchaudio==2.9.1 \
        --extra-index-url https://download.pytorch.org/whl/cu128

# ── pyproject.toml deps (uv sync equivalent) ─────────────────────────────────
COPY pyproject.toml .
RUN pip install --no-cache-dir \
        "accelerate==1.12.0" \
        "datasets==4.4.2" \
        "ipykernel==7.1.0" \
        "matplotlib==3.10.8" \
        "ninja==1.13.0" \
        "qwen-vl-utils==0.0.14" \
        "scipy==1.16.3" \
        "setuptools==80.9.0" \
        "transformers==4.57.3"

# ── requirements.txt deps ─────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir \
        "flask==2.3.3" \
        "flask-wtf==1.2.1" \
        "werkzeug==2.3.7" \
        "jinja2==3.1.6" \
        "flask-cors==4.0.0" \
        "python-dotenv==1.0.0" \
        "numpy==2.2.6" \
        "opencv-python-headless==4.13.0.92" \
        "Pillow==12.0.0" \
        "scenedetect==0.6.7.1" \
        "decord==0.6.0" \
        "ftfy==6.1.1" \
        "iopath==0.1.10" \
        "tqdm==4.65.0" \
        "urllib3==1.26.15" \
        "soundfile==0.13.1" \
        "cryptography==44.0.3" \
        "faiss-cpu==1.13.2" \
        "openai-whisper==20250625" \
        "sqlalchemy==2.0.48" \
        "psycopg2-binary" \
        "huggingface-hub==0.36.0" \
        "safetensors==0.7.0" \
        "tokenizers==0.22.1" \
        "regex==2025.11.3" \
        "requests==2.32.5" \
        "pyyaml==6.0.3" \
        "pyarrow==22.0.0" \
        "pandas==2.3.3" \
        "av==16.0.1" \
        "triton==3.5.1" \
        "gunicorn==23.0.0"

# ── git-based packages ────────────────────────────────────────────────────────
RUN pip install --no-cache-dir \
        "peft @ git+https://github.com/huggingface/peft@08cb3dde577747f6ca6638c884fd66fd16cf2e9d" \
        "pytorchvideo @ git+https://github.com/facebookresearch/pytorchvideo.git"

# ── flash-attn (must come after torch, no build isolation) ────────────────────
RUN pip install --no-cache-dir flash-attn --no-build-isolation


# ─── Stage 2: Compile – produce .pyc bytecode only ──────────────────────────
FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04 AS compiler

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
    && add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
        python3.12 \
        python3.12-venv \
    && rm -rf /var/lib/apt/lists/*

# Use an isolated directory /build – completely separate from .venv –
# so that compileall and find only ever touch our application source files.
WORKDIR /build

# Copy all application source files into /build
COPY app.py \
     config.py \
     db_utils.py \
     embedding_utils.py \
     generate_key.py \
     setup_db.py \
     ./

COPY utils/ ./utils/
COPY src/   ./src/

# Compile every .py → .pyc beside it (-b flag), then delete all .py sources.
# Because /build contains ONLY our source files (no .venv), find is safe and clean.
RUN python3.12 -m compileall -b -q . \
    && find . -name "*.py" -delete


# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# Runtime system dependencies only
# python3.12 is not in the default Ubuntu 22.04 repos – add deadsnakes PPA first
RUN apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
        curl \
    && add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
        python3.12 \
        python3.12-venv \
        ffmpeg \
        libsm6 \
        libxext6 \
        libgl1 \
        libglib2.0-0 \
        libsndfile1 \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN apt update && \
    apt install -y git wget ffmpeg libsm6 libxext6 dmidecode sudo 

# Copy the venv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy checkpoints
COPY ./checkpoints ./checkpoints

# Copy only the compiled .pyc bytecode – no .py sources included
COPY --from=compiler /build/app.pyc              ./app.pyc
COPY --from=compiler /build/config.pyc           ./config.pyc
COPY --from=compiler /build/db_utils.pyc         ./db_utils.pyc
COPY --from=compiler /build/embedding_utils.pyc  ./embedding_utils.pyc
COPY --from=compiler /build/generate_key.pyc     ./generate_key.pyc
COPY --from=compiler /build/setup_db.pyc         ./setup_db.pyc
COPY --from=compiler /build/utils/               ./utils/
COPY --from=compiler /build/src/                 ./src/

# Runtime volume for working directory (models, database files, etc.)
VOLUME ["/app/work_dir"]

# Expose the Flask port (default 5801, overridable at runtime)
EXPOSE 5801

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:5801/status || exit 1

# Entrypoint – run the compiled bytecode directly; runtime CLI args
# (--port, --batch_size, --database_url) are appended by docker compose
# or passed directly on `docker run`.

EXPOSE 5800

# Cloud license management – customers must supply these at runtime:
#   docker run -e LICENSE_KEY="<token>" -e LICENSE_SERVER_URL="https://your-project.vercel.app" ...
ENV LICENSE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlci1hY2Nlc3NvIiwiZXhwIjoxNzgwNzA0MDAwLCJtb250aGx5X2NyZWRpdHMiOjEwMDAuMCwiaWF0IjoxNzc1NzEzNzQ1fQ.CWqIvbaDiy0xzUi0kO6hXSeHVL4ZK4WgqP5DnCgUUKw"
ENV LICENSE_SERVER_URL="https://licenseserver-lime.vercel.app"

# App config passed via environment variables (read by argparse fallback in app.py)
ENV WORKING_DIR="/work_dir"
ENV BATCH_SIZE="4"
ENV PORT="5800"
ENV DATABASE_URL="sqlite:////work_dir/video_search.db"

ENTRYPOINT ["gunicorn", \
            "--workers", "1", \
            "--threads", "4", \
            "--timeout", "300", \
            "--bind", "0.0.0.0:5800", \
            "app:wsgi_app"]