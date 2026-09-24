# Stef Guest Book

A static, mobile-friendly guest book site for Stef.

## Fastest way to publish

1. Create a free account at Netlify.
2. Choose **Add new site → Deploy manually**.
3. Drag the entire `stef-guestbook` folder (or its ZIP contents) into the upload area.
4. Netlify will give you a public `netlify.app` URL.

The memory form is configured as a Netlify Form (`stef-memory`). Once deployed on Netlify, submissions will appear in the site's Netlify dashboard.

## Important

This first version intentionally does not require Supabase or any API keys.

The site includes:
- responsive memorial landing page
- memory wall
- featured quote cards
- memory submission form
- permission checkbox
- Netlify form integration
- photo URL field
- moderation note

### Photo handling

The current form accepts a photo URL rather than uploading the image itself. This keeps the first deployment simple and avoids requiring a storage backend.

The next production upgrade can add:
- direct photo uploads
- image moderation
- an actual shared memory database
- approved memories appearing automatically on the wall
- an admin/moderation screen
- QR code and permanent custom domain

Do not put private API keys into this static site.
