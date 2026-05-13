# ⚡ INÍCIO RÁPIDO - Notebook 100%

**5 minutos e tudo rodando no seu PC!**

---

## 1️⃣ Pré-requisitos (1 min)

- ✅ Docker Desktop instalado
- ✅ Este projeto clonado/copiado

---

## 2️⃣ Iniciar Sistema (2 min)

### Windows
```bash
# Duplo clique em:
start-local.bat
```

### Mac / Linux
```bash
bash start-local.sh
```

### Ou manual (qualquer SO)
```bash
docker-compose up -d
```

---

## 3️⃣ Acessar (1 min)

Abra no navegador:

```
http://localhost:3000
```

**Login:**
```
Usuário: admin
Senha: 123456
```

---

## 4️⃣ Configurar ESP32 (1 min)

[→ Veja CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md)

---

## ✅ Pronto!

Sistema rodando 100% no notebook! 🎉

---

## 📚 Próximas Leituras

| Assunto | Arquivo |
|---------|---------|
| Setup Completo | [LOCAL_SETUP.md](LOCAL_SETUP.md) |
| Configurar ESP32 | [CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md) |
| Ver Status | `docker-compose ps` |
| Ver Logs | `docker-compose logs -f` |
| Parar Sistema | `docker-compose down` |

---

## 🆘 Problema?

```bash
# Verificar containers
docker-compose ps

# Ver logs
docker-compose logs backend

# Reiniciar
docker-compose down
docker-compose up -d
```
