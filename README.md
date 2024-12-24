# Mini Bootcamp Starter Code

This is a starter code for mini bootcamp: https://dub.sh/ngooding-7-hari

![demo](https://assets.pika.style/0327b37e-b8d0-47af-80c5-f8cdeacbfd96/editor-images/screenshot-editor/pika-1735009615658.png)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables for:
   - Database connection
   - AWS S3 credentials
   - ElevenLabs API key
   - NextAuth configuration

4. Initialize the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run typecheck` - Check TypeScript types
- `npm run format:write` - Format code with Prettier
- `npm run db:studio` - Open Drizzle Studio

## Database Management

- Generate migrations: `npm run db:generate`
- Push schema changes: `npm run db:push`
- Manage database: `npm run db:studio`

## Contributing

1. Create a new branch
2. Make your changes
3. Run `npm run check` to ensure everything is working
4. Submit a pull request

## License

This project is private and proprietary.
