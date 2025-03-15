FROM --platform=$BUILDPLATFORM docker.io/library/node:20.3.1 AS build

WORKDIR /src
COPY ["ui/package.json", "ui/yarn.lock", "./"]

RUN yarn install --network-timeout 200000 && \
    yarn cache clean

COPY ["ui/", "."]

ARG TARGETARCH
RUN HOST_ARCH=$TARGETARCH NODE_ENV='production' NODE_ONLINE_ENV='online' NODE_OPTIONS=--max_old_space_size=8192 yarn build

# Use a minimal base image for the final container that holds only the built artifact
FROM alpine:latest

# Set working directory
WORKDIR /output

# Copy the built file from the build container
COPY --from=build /src/dist/resources/extension-Rollout.js ./extension-Rollout.js

# Set entrypoint (optional, for debugging)
CMD ["ls", "-lah", "/output"]
