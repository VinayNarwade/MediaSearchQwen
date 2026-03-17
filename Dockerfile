# ─── Stage 1: Build (install heavy deps inside venv) ────────────────────────
FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.12 \
        python3.12-dev \
        python3.12-venv \
        python3-pip \
        build-essential \
        cmake \
        ninja-build \
        git \
        curl \
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
        torch==2.8.0 \
        torchvision==0.23.0 \
        torchaudio==2.8.0 \
        --extra-index-url https://download.pytorch.org/whl/cu128

# ── pyproject.toml deps (uv sync equivalent) ─────────────────────────────────
COPY pyproject.toml .
RUN pip install --no-cache-dir \
        "accelerate>=1.12.0" \
        "datasets>=4.4.2" \
        "ipykernel>=7.1.0" \
        "matplotlib>=3.10.8" \
        "ninja>=1.13.0" \
        "qwen-vl-utils>=0.0.14" \
        "scipy>=1.16.3" \
        "setuptools>=80.9.0" \
        "transformers>=4.57.3"

# ── requirements.txt deps ─────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir \
        "flask>=3.1.3" \
        "flask-wtf>=1.2.1" \
        "werkzeug>=3.0.0" \
        "jinja2>=3.1.2" \
        "flask-cors>=4.0.0" \
        "python-dotenv>=1.0.0" \
        "numpy>=1.21.2" \
        "opencv-python-headless>=4.13.0.92" \
        "Pillow>=10.2.0" \
        "scenedetect>=0.6.3" \
        "decord>=0.6.0" \
        "ftfy==6.1.1" \
        "iopath==0.1.10" \
        "tqdm>=4.66.1" \
        "urllib3==1.26.15" \
        "SoundFile" \
        "cryptography==44.0.3" \
        "faiss-cpu" \
        "openai-whisper" \
        "sqlalchemy" \
        "psycopg2-binary" \
        "huggingface-hub" \
        "safetensors" \
        "tokenizers" \
        "regex" \
        "requests" \
        "pyyaml" \
        "pyarrow" \
        "pandas" \
        "av" \
        "triton"

# ── git-based packages ────────────────────────────────────────────────────────
RUN pip install --no-cache-dir \
        "peft @ git+https://github.com/huggingface/peft@08cb3dde577747f6ca6638c884fd66fd16cf2e9d" \
        "pytorchvideo @ git+https://github.com/facebookresearch/pytorchvideo.git"

# ── flash-attn (must come after torch, no build isolation) ────────────────────
RUN pip install --no-cache-dir flash-attn --no-build-isolation


# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# Runtime system dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.12 \
        python3.12-venv \
        ffmpeg \
        libsm6 \
        libxext6 \
        libgl1 \
        libglib2.0-0 \
        libsndfile1 \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the venv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source (excluding work_dir and APITest)
COPY app.py \
     config.py \
     db_utils.py \
     embedding_utils.py \
     generate_key.py \
     create_key.py \
     languagebind_utils.py \
     setup_db.py \
     ./

COPY utils/ ./utils/
COPY src/  ./src/

# Runtime volume for working directory (models, database files, etc.)
VOLUME ["/app/work_dir"]

# Expose the Flask port (default 5801, overridable at runtime)
EXPOSE 5801

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:5801/status || exit 1

# Entrypoint – runtime CLI args (--port, --batch_size, --database_url) are
# appended by docker compose or passed directly on `docker run`.
ENTRYPOINT ["python", "app.py"]
CMD ["--port", "5801", "--working_dir", "/app/work_dir"]
