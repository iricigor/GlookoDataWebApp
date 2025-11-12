# Features Architecture

This directory contains the feature-based architecture for the GlookoDataWebApp. The codebase has been reorganized from monolithic utility files into feature-based containers with smaller, focused modules to minimize merge conflicts and improve maintainability.

## Directory Structure

```
src/features/
├── export/           # Excel export functionality
│   ├── utils/        # Export utility functions
│   │   ├── converter.ts    # ZIP to XLSX conversion (~90 lines)
│   │   ├── download.ts     # File download (~20 lines)
│   │   ├── formatting.ts   # Cell styling (~110 lines)
│   │   ├── helpers.ts      # Helper utilities (~85 lines)
│   │   ├── worksheet.ts    # Worksheet population (~155 lines)
│   │   └── index.ts        # Barrel export
│   ├── components/   # Export-related components (future)
│   └── index.ts      # Feature barrel export
│
├── dataUpload/       # Data upload and ZIP processing
│   ├── components/   # Upload UI components
│   │   ├── FileList.tsx           # File list display
│   │   ├── FileList.test.tsx      # File list tests
│   │   ├── FileUploadZone.tsx     # Upload dropzone
│   │   └── index.ts               # Barrel export
│   ├── utils/        # Upload utility functions
│   │   ├── zipUtils.ts            # ZIP processing (~240 lines)
│   │   ├── zipUtils.test.ts       # ZIP tests
│   │   └── index.ts               # Barrel export
│   └── index.ts      # Feature barrel export
│
└── shared/           # Shared utilities across features
    ├── utils/        # Shared utility functions
    ├── hooks/        # Shared React hooks
    ├── types/        # Shared TypeScript types
    └── components/   # Shared components
```

## Architecture Principles

### 1. Feature-Based Organization
- Each feature is self-contained in its own directory
- Related code (components, utils, tests) lives together
- Easy to find and modify feature-specific code

### 2. File Size Guidelines
- **Components**: 30-80 lines (presentation only)
- **Containers**: 50-100 lines (logic/orchestration)
- **Utils**: 50-150 lines (pure functions)
- Exceptions: Index/barrel files for exports

### 3. Container/Presentation Pattern
- **Containers** (future): Handle state, orchestration, no direct UI
- **Components**: Receive props, render UI, no business logic
- **Utils**: Pure functions, no React dependencies, testable in isolation

### 4. Barrel Exports
Each feature and subfolder has an `index.ts` barrel export for clean imports:

```typescript
// Instead of:
import { convertZipToXlsx } from '../features/export/utils/converter';
import { downloadXlsx } from '../features/export/utils/download';

// Use:
import { convertZipToXlsx, downloadXlsx } from '../features/export';
```

### 5. Test Colocation
Tests live alongside source files for better maintainability:
```
utils/
├── helpers.ts
├── helpers.test.ts
├── converter.ts
└── converter.test.ts
```

## Path Aliases

Path aliases are configured in `tsconfig.app.json` and `vite.config.ts`:

```typescript
import { FileList } from '@/features/dataUpload';
import { convertZipToXlsx } from '@/features/export';
import type { UploadedFile } from '@/types';
```

Available aliases:
- `@/features/*` - Feature modules
- `@/utils/*` - General utilities
- `@/types/*` - TypeScript types
- `@/hooks/*` - React hooks
- `@/components/*` - Shared components
- `@/pages/*` - Page components
- `@/shared/*` - Shared modules

## Benefits

### Conflict Reduction
- ✅ 435-line xlsxUtils.ts split into 5 files (70-110 lines each)
- ✅ Different developers can work on different files simultaneously
- ✅ Lower chance of editing the same file

### Code Quality
- ✅ Single Responsibility Principle
- ✅ Easier to understand and maintain
- ✅ Simpler to test each module
- ✅ Better code organization and discoverability

### Developer Experience
- ✅ Faster code reviews (smaller PRs)
- ✅ Clearer PR intent (one feature per PR)
- ✅ Easier to revert if needed
- ✅ Better IDE performance (smaller files)

### Scalability
- ✅ Easy to add new features without touching existing code
- ✅ New developers can find related code easily
- ✅ Feature-based organization scales as project grows

## Adding a New Feature

1. **Create the feature structure**:
   ```bash
   mkdir -p src/features/myFeature/{components,utils,containers}
   ```

2. **Add your modules** (follow file size guidelines):
   - Create focused, single-purpose files
   - Keep functions pure and testable
   - Colocate tests with source files

3. **Create barrel exports**:
   ```typescript
   // src/features/myFeature/utils/index.ts
   export { myUtil } from './myUtil';
   
   // src/features/myFeature/index.ts
   export * from './utils';
   export * from './components';
   ```

4. **Update imports** in consuming code:
   ```typescript
   import { myUtil } from '@/features/myFeature';
   ```

## Migration Status

### Completed
- ✅ Export feature (xlsxUtils split into 5 modules)
- ✅ Data upload feature (zipUtils + components)
- ✅ Barrel exports for clean imports
- ✅ Path aliases configured

### Future Enhancements
- Container components for state management
- Shared utilities in `src/shared/`
- Additional feature modules as needed

## Contributing

When adding or modifying features:
1. Keep files small and focused (follow size guidelines)
2. Write tests for new functionality
3. Use barrel exports for clean imports
4. Update this README if adding new features
5. One feature per PR to minimize conflicts

## Questions?

See the main project documentation:
- [README.md](../../README.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - Coding standards
