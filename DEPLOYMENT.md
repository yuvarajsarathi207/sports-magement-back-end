# Deploying to Hostinger (without Docker)

This project runs as a standard Laravel PHP application, so it can be hosted on **Hostinger** (or any PHP hosting) without Docker.

## Requirements

- **PHP** 8.1 or higher (Hostinger supports multiple PHP versions in hPanel)
- **Composer** (run locally or via SSH if your plan allows)
- **Database**: MySQL or PostgreSQL (Hostinger shared often provides MySQL; VPS/Business may offer PostgreSQL)
- **Web server**: Apache with `mod_rewrite` (default on Hostinger)

## 1. Prepare and deploy

**Option A – Use the deployment script (recommended)**

From the project root (where `artisan` and `hostinger-deploy.sh` live):

```bash
cp .env.hostinger.example .env
# Edit .env with your DB credentials and APP_URL=https://keepplaying.in

chmod +x hostinger-deploy.sh
./hostinger-deploy.sh
```

This installs dependencies, generates the app key, sets permissions, runs migrations, seeds the DB, generates Swagger docs, and caches config/routes/views.

**Option B – Manual steps**

```bash
cp .env.hostinger.example .env
# Edit .env with your production values

composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If you use **MySQL** on Hostinger, set in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

Create the database and user in **hPanel → Databases → MySQL Databases**, then run migrations (via SSH or one-time script).

## 2. Upload to Hostinger

- Upload the full project (e.g. via **File Manager**, **FTP**, or **Git** if available).
- Do **not** expose `.env` publicly; keep it outside the web root or ensure the server blocks access to `.env`.

## 3. Set document root to `public`

Laravel must be served from the `public` folder so that `index.php` is the entry point and sensitive files (`.env`, `vendor`, etc.) are not under the web root.

**Option A – Subdomain or addon domain**

- In hPanel: **Domains → Your domain → Document root**
- Set to: `public_html/your-project/public`  
  (or the path where your project’s `public` folder lives).

**Option B – Main domain**

- If the whole site is this Laravel app, set document root to: `public_html/public` (after moving the project so that `public` is inside `public_html`),  
  or use a path like `public_html/kp_backend/public` if the project is in a subfolder.

## 4. Environment on Hostinger

Use `.env.hostinger.example` as a template. Important variables:

| Variable       | Example / note |
|----------------|----------------|
| `APP_ENV`      | `production`   |
| `APP_DEBUG`    | `false`        |
| `APP_URL`      | `https://keepplaying.in` |
| `APP_KEY`      | Generate with `php artisan key:generate` (once) |
| `DB_*`         | From hPanel → Databases (MySQL or PostgreSQL) |
| `L5_SWAGGER_CONST_HOST` | `https://keepplaying.in` (so Swagger UI points to your API) |

After changing `.env`, run (if you have SSH):

```bash
php artisan config:clear
php artisan config:cache
```

## 5. Permissions

Ensure the web server can write to Laravel’s directories:

```bash
chmod -R 775 storage bootstrap/cache
```

If you don’t have SSH, use File Manager: right‑click `storage` and `bootstrap/cache` → Permissions → set to `775` (and ensure the correct owner if shown).

## 6. Optional: cron (scheduler)

If you use the Laravel scheduler, add a cron job in hPanel → **Advanced → Cron Jobs**:

```text
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

Replace `/path/to/your/project` with the full path to the project root (not `public`).

## 7. Swagger / API docs

- In production, you can set `L5_SWAGGER_GENERATE_ALWAYS=false` and generate the docs once after deploy:
  `php artisan l5-swagger:generate`
- Ensure `storage/api-docs` is writable so the generated JSON can be saved.

## 8. Using the deployment script on the server

If you have **SSH** access on Hostinger:

```bash
./hostinger-deploy.sh          # Full setup (first time)
./hostinger-deploy.sh migrate  # Run migrations only
./hostinger-deploy.sh cache    # Clear and rebuild caches
./hostinger-deploy.sh swagger  # Regenerate API docs
```

Without SSH, run the same `php artisan` and `composer` commands via Hostinger’s **PHP** or **Run Script** tools if available, or run the script locally and upload the project (including `storage/api-docs` if you generated Swagger).

## Summary checklist

- [ ] PHP 8.1+ selected in hPanel
- [ ] Database (MySQL or PostgreSQL) created; `.env` updated with correct `DB_*`
- [ ] Project uploaded; document root points to `public`
- [ ] `.env` created and `APP_KEY` set; `APP_DEBUG=false`, `APP_ENV=production`
- [ ] `storage` and `bootstrap/cache` writable (775)
- [ ] Migrations run once
- [ ] Config and route caches run: `php artisan config:cache` (and route/view cache if used)
- [ ] API base URL: `https://keepplaying.in/api`  
- [ ] Swagger UI: `https://keepplaying.in/api/documentation`

For local development:

```bash
./hostinger-deploy.sh   # Full setup (run once in project root)
php artisan serve       # Starts PHP built-in server at http://localhost:8000
```
