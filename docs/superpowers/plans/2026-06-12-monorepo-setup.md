# Ambagan Monorepo Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Turborepo monorepo with Next.js web app, Expo mobile app, NestJS API, shared packages, and Docker-backed PostgreSQL + pgAdmin.

**Architecture:** Turborepo manages the build pipeline across three apps and three shared packages. The API connects to PostgreSQL via TypeORM; Docker Compose provisions Postgres and pgAdmin locally. Apps share code through workspace packages using pnpm's `workspace:*` protocol.

**Tech Stack:** pnpm 9 workspaces · Turborepo 2 · Next.js 14 (App Router) · Expo SDK 51 · NestJS 10 · TypeORM 0.3 · PostgreSQL 16 · pgAdmin 4 · TypeScript 5.3

---

## File Map

```
ambagan/
├── package.json                         root workspace + scripts
├── pnpm-workspace.yaml                  workspace globs
├── turbo.json                           Turborepo pipeline
├── .npmrc                               pnpm settings
├── .gitignore
├── .env.example
├── docker-compose.yml
├── packages/
│   ├── config/
│   │   ├── package.json
│   │   ├── eslint-preset.js
│   │   └── tsconfig/
│   │       ├── base.json
│   │       ├── nextjs.json
│   │       ├── react-native.json
│   │       └── nest.json
│   ├── utils/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   └── src/
│   │       ├── index.ts
│   │       ├── format.ts
│   │       ├── validation.ts
│   │       └── __tests__/
│   │           ├── format.test.ts
│   │           └── validation.test.ts
│   └── ui/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── Button.tsx
└── apps/
    ├── api/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── tsconfig.build.json
    │   ├── nest-cli.json
    │   ├── .env.example
    │   └── src/
    │       ├── main.ts
    │       ├── app.module.ts
    │       ├── app.controller.ts
    │       ├── app.service.ts
    │       └── app.controller.spec.ts
    ├── web/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── next.config.ts
    │   └── app/
    │       ├── layout.tsx
    │       └── page.tsx
    └── mobile/
        ├── package.json
        ├── tsconfig.json
        ├── app.json
        ├── babel.config.js
        └── App.tsx
```

---

### Task 1: Root Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `.env.example`

**Prerequisites:** Install pnpm globally if absent: `npm i -g pnpm@9`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "ambagan",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `.npmrc`**

```ini
auto-install-peers=true
shared-workspace-lockfile=true
link-workspace-packages=true
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
dist
.next
out
build
*.tsbuildinfo

# Turbo
.turbo

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
*.pem
Thumbs.db

# Testing
coverage

# Expo
.expo
ios/
android/

# Docker
pgdata/
```

- [ ] **Step 6: Create `.env.example`**

```dotenv
# PostgreSQL
POSTGRES_USER=ambagan
POSTGRES_PASSWORD=ambagan_secret
POSTGRES_DB=ambagan_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@ambagan.com
PGADMIN_DEFAULT_PASSWORD=pgadmin_secret
PGADMIN_PORT=5050

# NestJS API
API_PORT=3001
NODE_ENV=development

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 7: Verify pnpm recognizes workspaces**

```bash
pnpm install
```

Expected: Creates `node_modules` and `pnpm-lock.yaml` at root with no errors (zero packages installed yet — that's fine).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .npmrc .gitignore .env.example
git commit -m "chore: initialize Turborepo monorepo root"
```

---

### Task 2: packages/config — Shared TypeScript & ESLint Configs

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/nextjs.json`
- Create: `packages/config/tsconfig/react-native.json`
- Create: `packages/config/tsconfig/nest.json`
- Create: `packages/config/eslint-preset.js`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@ambagan/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig", "eslint-preset.js"],
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/config/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `packages/config/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "incremental": true
  },
  "include": ["src", "next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `packages/config/tsconfig/react-native.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["dom", "esnext"],
    "allowJs": true
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `packages/config/tsconfig/nest.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "strictNullChecks": false
  }
}
```

- [ ] **Step 6: Create `packages/config/eslint-preset.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
  env: {
    node: true,
    es2022: true,
  },
};
```

- [ ] **Step 7: Install config package deps**

```bash
pnpm install
```

Expected: `@ambagan/config` dev deps installed, no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/config
git commit -m "chore: add shared tsconfig and eslint config package"
```

---

### Task 3: packages/utils — Shared Business Logic

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/jest.config.js`
- Create: `packages/utils/src/format.ts`
- Create: `packages/utils/src/validation.ts`
- Create: `packages/utils/src/index.ts`
- Create: `packages/utils/src/__tests__/format.test.ts`
- Create: `packages/utils/src/__tests__/validation.test.ts`

- [ ] **Step 1: Create `packages/utils/package.json`**

```json
{
  "name": "@ambagan/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@ambagan/config": "workspace:*",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/utils/tsconfig.json`**

```json
{
  "extends": "@ambagan/config/tsconfig/base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

- [ ] **Step 3: Create `packages/utils/jest.config.js`**

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
};
```

- [ ] **Step 4: Write the failing tests**

Create `packages/utils/src/__tests__/format.test.ts`:

```ts
import { formatCurrency, formatDate } from "../format";

describe("formatCurrency", () => {
  it("formats a number as PHP currency", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1,000");
    expect(result).toContain("₱");
  });

  it("accepts a custom currency code", () => {
    const result = formatCurrency(50, "USD");
    expect(result).toContain("$");
  });
});

describe("formatDate", () => {
  it("formats a Date object to a readable string", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toMatch(/Jan/i);
    expect(result).toContain("2024");
  });

  it("accepts an ISO date string", () => {
    const result = formatDate("2024-06-01");
    expect(result).toMatch(/Jun/i);
  });
});
```

Create `packages/utils/src/__tests__/validation.test.ts`:

```ts
import { isEmail, isNonEmpty } from "../validation";

describe("isEmail", () => {
  it("returns true for a valid email", () => {
    expect(isEmail("user@example.com")).toBe(true);
  });

  it("returns false for a string without @", () => {
    expect(isEmail("not-an-email")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isEmail("")).toBe(false);
  });
});

describe("isNonEmpty", () => {
  it("returns true for a non-empty string", () => {
    expect(isNonEmpty("hello")).toBe(true);
  });

  it("returns false for blank string", () => {
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isNonEmpty("")).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests to confirm they fail**

```bash
cd packages/utils && pnpm test
```

Expected: FAIL — `Cannot find module '../format'` or similar.

- [ ] **Step 6: Implement `src/format.ts`**

```ts
export function formatCurrency(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(date));
}
```

- [ ] **Step 7: Implement `src/validation.ts`**

```ts
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
```

- [ ] **Step 8: Create `src/index.ts`**

```ts
export * from "./format";
export * from "./validation";
```

- [ ] **Step 9: Run tests — confirm they pass**

```bash
pnpm test
```

Expected: 7 passing tests, 0 failures.

- [ ] **Step 10: Verify build**

```bash
pnpm build
```

Expected: `dist/` created with `index.js`, `index.d.ts`, `format.js`, `format.d.ts`, `validation.js`, `validation.d.ts`.

- [ ] **Step 11: Commit**

```bash
cd ../..
git add packages/utils
git commit -m "feat: add shared utils package with format and validation helpers"
```

---

### Task 4: packages/ui — Shared React Components

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/Button.tsx`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@ambagan/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@ambagan/config": "workspace:*",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@ambagan/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/ui/src/Button.tsx`**

```tsx
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/index.ts`**

```ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
```

- [ ] **Step 5: Install deps and verify build**

```bash
pnpm install && cd packages/ui && pnpm build
```

Expected: `dist/` created with `index.js`, `index.d.ts`, `Button.js`, `Button.d.ts`.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add packages/ui
git commit -m "feat: add shared ui package with Button component"
```

---

### Task 5: apps/api — NestJS Backend

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/app.controller.ts`
- Create: `apps/api/src/app.service.ts`
- Test: `apps/api/src/app.controller.spec.ts`

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@ambagan/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.2",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.20",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "@ambagan/config": "workspace:*",
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@ambagan/config/tsconfig/nest.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@ambagan/utils": ["../../packages/utils/src"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 3: Create `apps/api/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: Create `apps/api/.env.example`**

```dotenv
NODE_ENV=development
API_PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ambagan
POSTGRES_PASSWORD=ambagan_secret
POSTGRES_DB=ambagan_db
```

- [ ] **Step 6: Write the failing controller test**

Create `apps/api/src/app.controller.spec.ts`:

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it("GET /health returns status ok", () => {
    expect(appController.getHealth()).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 7: Run the test — confirm it fails**

```bash
cd apps/api && pnpm test
```

Expected: FAIL — `Cannot find module './app.controller'`.

- [ ] **Step 8: Implement `src/app.service.ts`**

```ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
```

- [ ] **Step 9: Implement `src/app.controller.ts`**

```ts
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
```

- [ ] **Step 10: Implement `src/app.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("POSTGRES_HOST", "localhost"),
        port: config.get<number>("POSTGRES_PORT", 5432),
        username: config.get("POSTGRES_USER", "ambagan"),
        password: config.get("POSTGRES_PASSWORD", "ambagan_secret"),
        database: config.get("POSTGRES_DB", "ambagan_db"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: config.get("NODE_ENV") !== "production",
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 11: Implement `src/main.ts`**

```ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 12: Run the test — confirm it passes**

```bash
pnpm test
```

Expected: 1 passing test, 0 failures.

> Note: The test mocks TypeORM out by not loading AppModule — this is correct; the health endpoint test should not need a live DB connection.

- [ ] **Step 13: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 14: Commit**

```bash
cd ../..
git add apps/api
git commit -m "feat: scaffold NestJS API with health endpoint and TypeORM setup"
```

---

### Task 6: apps/web — Next.js Frontend

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@ambagan/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next out"
  },
  "dependencies": {
    "@ambagan/ui": "workspace:*",
    "@ambagan/utils": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@ambagan/config": "workspace:*",
    "@types/node": "^20.12.0",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "@ambagan/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@ambagan/ui": ["../../packages/ui/src"],
      "@ambagan/utils": ["../../packages/utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create `apps/web/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ambagan/ui", "@ambagan/utils"],
};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/web/app/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ambagan",
  description: "Ambagan app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create `apps/web/app/page.tsx`**

```tsx
import { Button } from "@ambagan/ui";
import { formatCurrency } from "@ambagan/utils";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Ambagan</h1>
      <p>Sample amount: {formatCurrency(1500)}</p>
      <Button variant="primary">Get Started</Button>
    </main>
  );
}
```

- [ ] **Step 6: Install deps and verify typecheck**

```bash
pnpm install && cd apps/web && pnpm typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/web
git commit -m "feat: scaffold Next.js web app with shared ui and utils"
```

---

### Task 7: apps/mobile — Expo React Native

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/App.tsx`

- [ ] **Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "@ambagan/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "clean": "rm -rf .expo"
  },
  "dependencies": {
    "@ambagan/utils": "workspace:*",
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.0"
  },
  "devDependencies": {
    "@ambagan/config": "workspace:*",
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "babel-preset-expo": "~11.0.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `apps/mobile/tsconfig.json`**

```json
{
  "extends": "@ambagan/config/tsconfig/react-native.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ambagan/utils": ["../../packages/utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create `apps/mobile/app.json`**

```json
{
  "expo": {
    "name": "Ambagan",
    "slug": "ambagan",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

- [ ] **Step 4: Create `apps/mobile/babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
```

- [ ] **Step 5: Create `apps/mobile/App.tsx`**

```tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "@ambagan/utils";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ambagan</Text>
      <Text>Sample amount: {formatCurrency(1500)}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 6: Install deps**

```bash
pnpm install
```

Expected: Expo and React Native packages installed, no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile
git commit -m "feat: scaffold Expo mobile app with shared utils"
```

---

### Task 8: Docker — PostgreSQL & pgAdmin

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ambagan_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-ambagan}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ambagan_secret}
      POSTGRES_DB: ${POSTGRES_DB:-ambagan_db}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-ambagan}"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ambagan_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL:-admin@ambagan.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD:-pgadmin_secret}
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  pgdata:
  pgadmin_data:
```

- [ ] **Step 2: Copy `.env.example` to `.env`**

```bash
cp .env.example .env
```

- [ ] **Step 3: Start Docker services**

```bash
docker compose up -d
```

Expected output (after ~30 seconds):
```
✔ Container ambagan_postgres  Healthy
✔ Container ambagan_pgadmin   Started
```

- [ ] **Step 4: Verify PostgreSQL is accepting connections**

```bash
docker exec ambagan_postgres pg_isready -U ambagan
```

Expected: `/var/run/postgresql:5432 - accepting connections`

- [ ] **Step 5: Verify pgAdmin is reachable**

Open `http://localhost:5050` in a browser.

Expected: pgAdmin login page. Log in with `admin@ambagan.com` / `pgadmin_secret`.

To connect pgAdmin to the DB:
- Add New Server → Name: `ambagan`
- Connection tab → Host: `postgres` · Port: `5432` · Username: `ambagan` · Password: `ambagan_secret`

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for PostgreSQL 16 and pgAdmin"
```

---

### Task 9: Verify Full Turbo Build Pipeline

- [ ] **Step 1: Build all packages from root**

```bash
pnpm build
```

Expected: Turborepo builds in dependency order:
1. `@ambagan/config` (no build step — passes through)
2. `@ambagan/utils` → `dist/`
3. `@ambagan/ui` → `dist/`
4. `@ambagan/api` → `dist/` (NestJS compiled output)
5. `@ambagan/web` → `.next/`

All tasks must exit `FULL TURBO` or `>>> Finished` with no errors.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: utils 7 tests pass, api 1 test passes.

- [ ] **Step 3: Typecheck all workspaces**

```bash
pnpm typecheck
```

Expected: No TypeScript errors across all packages.

- [ ] **Step 4: Verify dev script starts (spot-check web)**

```bash
cd apps/web && pnpm dev
```

Expected: Next.js dev server starts at `http://localhost:3000`. Open the URL — you should see the "Ambagan" heading and a formatted Philippine Peso amount.

Stop the server with `Ctrl+C`.

- [ ] **Step 5: Spot-check API dev server (requires DB running)**

Ensure Docker is up (`docker compose up -d`), then:

```bash
cd apps/api && pnpm dev
```

Expected: `API running on http://localhost:3001`. Open `http://localhost:3001/health` — returns `{"status":"ok"}`.

Stop with `Ctrl+C`.

- [ ] **Step 6: Final commit**

```bash
cd ../..
git add .
git commit -m "chore: verify full turbo build and dev pipeline"
```

---

## Self-Review

### Spec Coverage
| Requirement | Covered by |
|---|---|
| `apps/web` — Next.js | Task 6 |
| `apps/mobile` — Expo | Task 7 |
| `apps/api` — NestJS | Task 5 |
| `packages/ui` — shared components | Task 4 |
| `packages/config` — shared eslint/tsconfig | Task 2 |
| `packages/utils` — shared logic | Task 3 |
| `package.json` + `turbo.json` | Task 1 |
| Docker + PostgreSQL + pgAdmin | Task 8 |

All requirements covered. ✓

### Type Consistency
- `AppController.getHealth()` returns `{ status: string }` — matches `AppService.getHealth()` return type ✓
- `Button` props extend `React.ButtonHTMLAttributes<HTMLButtonElement>` — used correctly in `apps/web/app/page.tsx` ✓
- `@ambagan/utils` exports match what `apps/web` and `apps/mobile` import ✓
- Workspace package names (`@ambagan/config`, `@ambagan/ui`, `@ambagan/utils`) consistent throughout ✓
