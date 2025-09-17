# 🖼️ Secure Image Gallery

Varna galerija slik z obsežnim sledenjem zgodovine, zgrajena z Vue.js, Express.js in PostgreSQL.

## ✨ Funkcionalnosti

-   🔐 **Varna hramba slik** - AES-256-GCM šifriranje
-   📊 **Sledenje zgodovine** - Popoln audit trail vseh dejanj
-   🔗 **Deljenje slik** - Varne povezave z omejitvijo časa
-   🖼️ **Avtomatske sličice** - Obdelava slik v ozadju
-   👤 **Avtentifikacija** - JWT žetoni z varnimi piškotki
-   ❤️ **Všečkanje** - Interakcija uporabnikov
-   🐳 **Docker** - Enostavna namestitev in distribucija

## 🛠️ Tehnologije

### Frontend

-   **Vue 3** + TypeScript + Composition API
-   **PrimeVue** - UI komponente
-   **Vue Router** - Navigacija
-   **Vite** - Build sistem

### Backend

-   **Express.js** + TypeScript
-   **Prisma ORM** + PostgreSQL
-   **Sharp** - Obdelava slik
-   **JWT** - Avtentifikacija
-   **Multer** - Upload datotek

### Deployment

-   **Docker** + Docker Compose
-   **Nginx** - Web server
-   **PostgreSQL** - Podatkovna baza

## 🚀 Hitra namestitev (Docker)

### Predpogoji

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Kloniraj repozitorij

```bash
git clone https://github.com/your-username/image-gallery-app.git
cd image-gallery-app
```

### 2. Konfiguriraj okolje

```bash
# Kopiraj primer konfiguracije
cp .env.example .env

# Za potrebe tega primera so v .env.example nastavljene primerne vrednosti
```

### 3. Zaženi aplikacijo

```bash
# Zgradi in zaženi vse storitve
docker-compose up -d

# Preveri status
docker-compose ps
```

### 4. Dostop do aplikacije

-   **Frontend**: http://localhost
-   **Backend API**: http://localhost:5000
-   **Podatkovna baza**: localhost:5433

### Docker ukazi

```bash
# Zgradi in zaženi
docker-compose up -d

# Preveri status
docker-compose ps

# Poglej loge
docker-compose logs -f

# Ustavi storitve
docker-compose down

# Ponovno zgradi
docker-compose build --no-cache
```
