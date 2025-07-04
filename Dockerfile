FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including Python 3.11
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    postgresql-client \
    redis-tools \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for development with home directory
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 -m appuser

# Install pip for Python 3.11 and make it the default python3
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && ln -sf /usr/bin/python3.11 /usr/bin/python

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install uv for Python package management
RUN python3.11 -m pip install uv

# Set Python environment variables for uv
ENV UV_PYTHON_DOWNLOADS=automatic
ENV UV_PROJECT_ENVIRONMENT=/app/ai/.venv

# Set working directory
WORKDIR /app

# Create directories for volume mounts with proper permissions
RUN mkdir -p /app/web /app/ai && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /home/appuser

# Copy entire applications
COPY --chown=appuser:appuser apps/web/ /app/web/
COPY --chown=appuser:appuser apps/ai/ /app/ai/

# Set npm global prefix to avoid permission issues
RUN mkdir -p /home/appuser/.npm-global && \
    chown -R appuser:appuser /home/appuser/.npm-global

# Switch to non-root user
USER appuser

# Configure npm to use the user directory
ENV NPM_CONFIG_PREFIX=/home/appuser/.npm-global
ENV PATH=/home/appuser/.npm-global/bin:$PATH

# Install Node.js dependencies
WORKDIR /app/web
RUN npm install

# Create .next directory with proper ownership
RUN mkdir -p .next && chown -R appuser:appuser .next

# Install Python dependencies
WORKDIR /app/ai
RUN uv sync

# Set up environment variables
ENV NODE_ENV=development
ENV ENVIRONMENT=development
ENV DOCKER=true
ENV DATABASE_URL=postgresql://maratron:yourpassword@host.docker.internal:5432/maratrondb
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=a5f8c2e7b1d9f4a6c8e3b7f2d5a9c4e6b8f1d3a7c9e2b5f8a1d4c7e9b2f5a8c1d4e7

# Expose ports
EXPOSE 3000 3001

# Create a start script
WORKDIR /app
COPY --chown=appuser:appuser start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]