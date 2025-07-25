# Project Structure

## Root Level Organization
```
/
├── src/                    # Source code
├── public/                 # Static assets
├── tests/                  # Test files
├── docs/                   # Documentation
├── config/                 # Configuration files
└── scripts/                # Build and utility scripts
```

## Source Code Structure
```
src/
├── components/             # Reusable UI components
├── pages/                  # Page-level components
├── services/               # API calls and business logic
├── utils/                  # Helper functions
├── hooks/                  # Custom React hooks (if React)
├── store/                  # State management
├── styles/                 # CSS/SCSS files
└── assets/                 # Images, fonts, etc.
```

## Key Directories

### `/src/components/`
- Reusable UI components
- Job cards, search bars, forms
- Navigation and layout components

### `/src/pages/`
- Job listings page
- Job detail page
- User profile/dashboard
- Company profile pages
- Authentication pages

### `/src/services/`
- API integration
- Authentication service
- Job search service
- User management service

## Naming Conventions
- Use PascalCase for component files
- Use camelCase for utility functions
- Use kebab-case for CSS classes
- Use UPPER_CASE for constants

## File Organization
- Group related files together
- Keep components small and focused
- Separate business logic from UI components
- Use index files for clean imports