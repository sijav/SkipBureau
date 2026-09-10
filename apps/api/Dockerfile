# The API, for a container host.
#
# The build context is the REPOSITORY ROOT, not this folder: it is an npm
# workspace and the lockfile lives at the root, so `npm ci` cannot run from
# here. Northflank configures the context and the Dockerfile path separately,
# so this file can stay beside the app it builds.
#
# Alpine is safe here, which is not true of every Prisma project. This one uses
# the `prisma-client` generator with the `@prisma/adapter-pg` driver adapter, so
# there is NO Rust query engine binary to go looking for a glibc that musl does
# not have. `nest build` compiles the generated client into
# dist/generated/prisma, so nothing TypeScript survives into the runtime.

FROM node:24-alpine AS build

WORKDIR /repo

# The manifests first, so a source change does not re-run the install.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# `--ignore-scripts`: apps/web's postinstall downloads a Chromium for
# Playwright, which is 150MB this image will never run.
RUN npm ci --ignore-scripts

COPY apps/api apps/api

RUN npm run db:generate -w @skipbureau/api \
 && npm run build -w @skipbureau/api


FROM node:24-alpine AS runtime

WORKDIR /repo
ENV NODE_ENV=production

# node_modules comes from the BUILD stage rather than a second install.
#
# The first version ran `npm ci --omit=dev` and then
# `npm install --no-save prisma tsx`, which fetched the LATEST prisma instead
# of the 7.10.0 this lockfile pins. A newer CLI renamed the command, so the
# container started, ran the migration, and died with "No command registered
# for `migrate`, did you mean `migration`?". Found by running the image rather
# than by reading it.
#
# Copying carries the dev dependencies too, which is the price of the
# entrypoint needing the prisma CLI and tsx. Pinning them by hand here would
# just be a second lockfile to forget to update.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY --from=build /repo/node_modules node_modules

COPY --from=build /repo/apps/api/dist apps/api/dist
# The migrations and prisma.config.ts, which is where Prisma 7 keeps the url.
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/

COPY apps/api/docker-entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# The app reads PORT and defaults to 4000.
EXPOSE 4000

ENTRYPOINT ["/usr/local/bin/entrypoint"]
