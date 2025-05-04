# ADHD Planner

A responsive web application designed to help people with ADHD manage tasks, projects, and time. Features include:

- Task management with due dates and categories
- Project organization
- Daily time blocking
- "What Now?" wizard to recommend tasks based on energy level and available time
- Drag-and-drop interface

## Technologies

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- DND Kit for drag-and-drop
- LocalStorage for persistence

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Deployment Options

### Netlify

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Sign up for [Netlify](https://www.netlify.com/)
3. Connect your Git repository to Netlify
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy!

Alternatively, use the Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
npm run netlify-deploy
```

### Vercel

1. Push your code to a Git repository
2. Sign up for [Vercel](https://vercel.com/)
3. Import your Git repository
4. Vercel will automatically detect the Vite project and configure the build settings
5. Deploy!

Alternatively, use the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
npm run vercel-deploy
```

### GitHub Pages

1. Push your code to a GitHub repository
2. Enable GitHub Pages in your repository settings
3. The GitHub workflow will automatically deploy your app to GitHub Pages when you push to the main branch

## License

MIT