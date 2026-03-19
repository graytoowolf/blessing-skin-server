# [Choice] PHP version (use -bullseye variants on local arm64/Apple Silicon): 8, 8.1, 8.2, 8.3, 8-bullseye, 8.1-bullseye, 8.2-bullseye, 8.3-bullseye, 8-buster, 8.1-buster, 8.2-buster, 8.3-buster
ARG VARIANT=8.3-bookworm
FROM mcr.microsoft.com/devcontainers/php:1-${VARIANT}

# Fix GPG key issue for yarn repository and disable it
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 62D54FD4003F6525 || true \
    && rm -f /etc/apt/sources.list.d/yarn.list \
    || true

# Install MariaDB client and ImageMagick for imagick extension
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y mariadb-client zlib1g-dev libpng-dev libzip-dev libwebp-dev libmagickwand-dev \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install php-mysql driver and imagick extension
RUN docker-php-ext-install mysqli pdo pdo_mysql gd zip \
    && pecl install imagick \
    && docker-php-ext-enable imagick

# [Choice] Node.js version: none, lts/*, 16, 14, 12, 10
ARG NODE_VERSION="none"
RUN if [ "${NODE_VERSION}" != "none" ]; then su vscode -c "umask 0002 && . /usr/local/share/nvm/nvm.sh && nvm install ${NODE_VERSION} 2>&1"; fi

# Enable Apache rewrite module
RUN a2enmod rewrite

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1

