# Deploying to Hostinger (without Docker)

This project runs as a standard Laravel PHP application, so it can be hosted on **Hostinger** (or any PHP hosting) without Docker.

## Requirements

- **PHP** 8.1 or higher (Hostinger supports multiple PHP versions in hPanel)
- **Composer** (run locally or via SSH if your plan allows)
- **Database**: MySQL or PostgreSQL (Hostinger shared often provides MySQL; VPS/Business may offer PostgreSQL)
- **Web server**: Apache with `mod_rewrite` (default on Hostinger)

## 1. Prepare and deploy

**Option A – Use the deployment script (recommended)**

From the project folder on Hostinger (`public_html/sports-magement-back-end`):

```bash
cd ~/public_html/sports-magement-back-end
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

## 2. Hostinger directory structure

On Hostinger the project lives in a subfolder under `public_html`:

```
public_html/
├── favicon.ico
├── index.php
├── robots.txt
└── sports-magement-back-end/     ← Laravel project (API)
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── public/                  ← document root must point here
    │   ├── index.php
    │   └── ...
    ├── storage/
    ├── vendor/
    ├── .env
    ├── artisan
    ├── hostinger-deploy.sh
    └── ...
```

- **Project path**: `public_html/sports-magement-back-end`
- **Document root** (in hPanel): `public_html/sports-magement-back-end/public`

Upload the full Laravel project into `public_html/sports-magement-back-end/`. Do **not** expose `.env`; it stays inside the project folder (above `public/`), so it is not web-accessible.

## 3. Set document root in hPanel

1. In **hPanel → Domains → keepplaying.in → Document root**
2. Set to: **`public_html/sports-magement-back-end/public`**

The site must be served from Laravel’s `public` folder so `index.php` is the entry point and `.env` / `vendor` are not under the web root.

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
* * * * * cd ~/public_html/sports-magement-back-end && php artisan schedule:run >> /dev/null 2>&1
```

Or use the full path Hostinger shows in the cron form (e.g. `/home/u468874340/public_html/sports-magement-back-end`).

## 7. Swagger / API docs

- In production, you can set `L5_SWAGGER_GENERATE_ALWAYS=false` and generate the docs once after deploy:
  `php artisan l5-swagger:generate`
- Ensure `storage/api-docs` is writable so the generated JSON can be saved.

## 8. Using the deployment script on the server

SSH into Hostinger, then go to the project folder and run the script:

```bash
cd ~/public_html/sports-magement-back-end
chmod +x hostinger-deploy.sh
./hostinger-deploy.sh          # Full setup (first time)
./hostinger-deploy.sh fix      # Fix 500 error (permissions + key + cache)
./hostinger-deploy.sh migrate  # Run migrations only
./hostinger-deploy.sh cache    # Clear and rebuild caches
./hostinger-deploy.sh swagger  # Regenerate API docs
```

Without SSH, run the same `php artisan` and `composer` commands via Hostinger’s **PHP** or **Run Script** tools (from `sports-magement-back-end`), or run the script locally and upload the project (including `storage/api-docs` if you generated Swagger).

## Troubleshooting 500 error

If you see a **500 Internal Server Error**:

### 1. Run the fix command (SSH)

```bash
cd ~/public_html/sports-magement-back-end
./hostinger-deploy.sh fix
```

This sets permissions (777 on `storage` and `bootstrap/cache`), ensures `APP_KEY` exists, and clears/rebuilds caches.

### 2. Check the Laravel log

The real error is in the log file. Via SSH or File Manager:

```bash
tail -50 storage/logs/laravel.log
```

Or open `storage/logs/laravel.log` in File Manager and read the last entries.

### 3. Common causes and fixes

| Cause | Fix |
|-------|-----|
| **APP_KEY empty or missing** | Run `php artisan key:generate` or run `./hostinger-deploy.sh fix`. |
| **Storage/bootstrap not writable** | `chmod -R 777 storage bootstrap/cache` or run `./hostinger-deploy.sh fix`. |
| **.env not found** | Ensure `.env` exists in `sports-magement-back-end/` (same folder as `artisan`), not inside `public/`. |
| **Wrong PHP version** | Laravel 10 needs PHP 8.1+. In hPanel set PHP version to 8.1 or 8.2. |
| **Database connection** | Check `DB_*` in `.env` (from hPanel → MySQL). |
| **Cached config wrong** | Run `php artisan config:clear` then `php artisan config:cache`. |

### 4. See the error in the browser (temporarily)

In `.env` set `APP_DEBUG=true`, reload the page to see the exception, then set `APP_DEBUG=false` again.

### 5. Document root

Confirm document root in hPanel is: **`public_html/sports-magement-back-end/public`** (must end with `/public`).

## Summary checklist

- [ ] PHP 8.1+ selected in hPanel
- [ ] Database (MySQL or PostgreSQL) created; `.env` updated with correct `DB_*`
- [ ] Project in `public_html/sports-magement-back-end`; document root is `public_html/sports-magement-back-end/public`
- [ ] `.env` created and `APP_KEY` set; `APP_DEBUG=false`, `APP_ENV=production`
- [ ] `storage` and `bootstrap/cache` writable (775 or 777; run `./hostinger-deploy.sh fix` if 500)
- [ ] Migrations run once
- [ ] Config and route caches run: `php artisan config:cache` (and route/view cache if used)
- [ ] API base URL: `https://keepplaying.in/api`  
- [ ] Swagger UI: `https://keepplaying.in/api/documentation`

For local development:

```bash
./hostinger-deploy.sh   # Full setup (run once in project root)
php artisan serve       # Starts PHP built-in server at http://localhost:8000
```
