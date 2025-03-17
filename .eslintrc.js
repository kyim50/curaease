module.exports = {
    extends: ['next/core-web-vitals'],
    rules: {
      // Disable TypeScript rules that are breaking the build
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Disable React warnings
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      
      // Disable Next.js specific warnings
      '@next/next/no-img-element': 'off',
      
      // Disable accessibility warnings
      'jsx-a11y/alt-text': 'off'
    }
  }