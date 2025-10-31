### 🔄 Steps with npm

1. **Install dependencies (if not already done)**

   ```bash
   npm install
   ```

2. **Build the project** (this generates the `dist/` folder)

   ```bash
   npm run build
   ```

3. **Preview locally (optional)**
   To check your changes before deploying:

   ```bash
   npm run preview
   ```

   It will start a local server (e.g., `http://localhost:4173`).

4. **Deploy to GitHub Pages**
   If you’ve set up `gh-pages` package, run:

   ```bash
   npm run deploy
   ```

   (This command is usually defined in your `package.json` as something like `"deploy": "gh-pages -d dist"`.)

   Otherwise, just **commit + push** the changes (`git push origin main`), and GitHub Pages will auto-build and update your live site.
