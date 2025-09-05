# 🚨 MAINTENANCE MODE - RESOURCE CONSERVATION

**Date:** 2025-01-05  
**Raison:** Consommation excessive de ressources Vercel (80% du plan Pro utilisé)

## 🛑 ACTIONS D'URGENCE PRISES :

1. **Cron jobs désactivés** - Suppression de `vercel.json` crons
2. **Endpoints jobs désactivés** - Routes `/api/jobs/*` retournent 503
3. **Pool connections limitées** - Réduction drastique des connexions DB
4. **Processing Meta API suspendu** - Temporairement désactivé

## 🔍 CAUSES IDENTIFIÉES :

- **20+ déploiements en quelques heures** → Multiplication des instances
- **Cron jobs récursifs** → Appels automatiques toutes les heures
- **Pool PostgreSQL non fermé** → Connexions qui s'accumulent 
- **Timeout infinis** → Functions qui ne se terminent jamais

## 🏥 MODE MAINTENANCE :

L'application reste accessible pour :
- ✅ Upload de fichiers (sans processing)
- ✅ Configuration targeting (sans jobs)  
- ✅ Interface utilisateur
- ❌ Processing Meta API (temporairement suspendu)

## 🚀 PLAN DE RÉCUPÉRATION :

1. Attendre que les ressources Vercel se régénèrent
2. Optimiser les endpoints pour réduire les invocations
3. Implémenter des rate limits
4. Tester en mode développement avant redéploiement
5. Réactiver progressivement les fonctionnalités

**Status:** 🔧 En cours de résolution