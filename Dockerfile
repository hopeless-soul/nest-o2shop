FROM node:22-alpine

# Corepack setup for native PNPM support
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest-10 --activate

WORKDIR /app

# Copy lockfile and manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./


# --- Development Stage ---
FROM base AS development
# Installs all dependencies (including devDependencies required for Nest CLI)
RUN pnpm install
# Copy rest of the application files
COPY . .
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]


# --- Production Build Stage ---
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
# Generates production /dist folder
RUN pnpm run build


# --- Production Runtime Stage ---
FROM base AS production
# Install production dependencies only to minimize image footprint
RUN pnpm install --prod --frozen-lockfile
# Pull compiled output from build step
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]