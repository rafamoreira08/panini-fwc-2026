# Panini Copa 2026 — Gerenciador de Figurinhas

Aplicação completa para gerenciar e trocar figurinhas da Copa do Mundo 2026 em grupos.

## ⚽ O que é?

Um app onde você marca as figurinhas que tem, identifica as repetidas automaticamente e encontra outras pessoas no grupo que têm as figurinhas que você precisa — mostrando também quais de suas repetidas elas não têm, facilitando trocas justas.

**Álbum completo:** 994 figurinhas
- FWC (Página Inicial): 9 stickers
- FIFA World Cup History: 11 stickers  
- 48 times × 20 figurinhas cada: 960 stickers
- Coca-Cola: 14 stickers

## 🚀 Stack

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript
- **Banco:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Styling:** Tailwind CSS v3
- **Ícones:** Lucide React

## ✨ Funcionalidades

| Recurso | O que faz |
|---------|----------|
| **Autenticação** | Cadastro e login por email/senha via Firebase |
| **Grupos** | Criar grupos, convidar amigos via link com código, entrar em múltiplos grupos |
| **Álbum** | 994 figurinhas organizadas por seção · Clique para marcar (tem/repetida) · Atualização otimista com debounce |
| **Trocas** | Buscar quem tem X figurinha · Ver suas repetidas que essa pessoa não tem · Listar suas repetidas + quem precisa de cada |
| **Membros** | Ranking do grupo com barra de progresso de cada membro |
| **Segurança** | Firestore Security Rules · Dados isolados por grupo · Apenas membros veem as trocas |

## 🔧 Setup

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Firebase](https://firebase.google.com)

### 2. Configurar Firebase
Siga o guia completo em [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)

Em resumo:
1. Criar projeto Firebase
2. Ativar Auth (Email/Password)
3. Criar Firestore Database
4. Copiar security rules
5. Obter credenciais do Firebase

### 3. Configurar projeto

```bash
# Clone o repositório (se estiver em outro lugar)
git clone <seu-repo>
cd panini-fwc-2026

# Instale as dependências
npm install

# Copie as variáveis de ambiente
cp .env.example .env.local

# Preencha .env.local com as credenciais do Firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc
```

### 4. Rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 📱 Como usar

### Primeira vez
1. **Criar conta** - email + senha
2. **Criar grupo** - dê um nome (ex: "Família Silva")
3. **Convidar amigos** - copie o código de convite
4. **Marcar figurinhas** - clique nas que você tem

### Marcar figurinhas
- **Clique esquerdo** → incremente (0 → 1 → 2 → 3...)
- **Clique direito** → decremente
- **0** = não tem (cinza)
- **1** = tem (verde)
- **2+** = repetida disponível (amarelo + badge)

### Buscar trocas
1. Vá para aba **Trocas**
2. **Buscar figurinha** → escolha qual precisa
3. Veja quem no grupo tem disponível
4. Veja quais de suas repetidas essa pessoa não tem
5. Combinem a troca (offline/WhatsApp/etc)

### Minhas repetidas
Veja todas suas figurinhas repetidas com um clique para expandir e ver quem precisa de cada uma.

## 📊 Estrutura do Firestore

```
users/{uid}/
├── name: string
├── email: string
└── createdAt: timestamp

groups/{groupId}/
├── name: string
├── inviteCode: string
├── createdBy: uid
└── createdAt: timestamp

groupMembers/{groupId}-{uid}/
├── groupId: string
├── userId: string
└── joinedAt: timestamp

userStickers/{userId}-{groupId}-{stickerId}/
├── userId: string
├── groupId: string
├── stickerId: string
├── quantity: number
└── updatedAt: timestamp
```

## 🛠 Desenvolvimento

### Estrutura de pastas

```
app/
├── (auth)/              # Páginas de login/register
├── (app)/               # Páginas protegidas
│   ├── dashboard/
│   └── groups/[groupId]/
│       ├── page.tsx (álbum)
│       ├── trades/page.tsx
│       └── members/page.tsx
├── api/auth/            # Rotas para sessão
├── actions/             # Server actions
└── globals.css

components/
├── ui/                  # Botões, inputs, etc
├── auth/
├── album/
├── trades/
├── groups/
└── layout/

lib/
├── firebase/            # Clientes Firebase
├── stickers.ts          # Catálogo estático de figurinhas
└── types.ts

public/                  # Assets estáticos
```

### Adicionar novo servidor/país

Edite `lib/stickers.ts`:

```typescript
export const TEAMS: TeamDef[] = [
  // ... existing
  { group: 'Z', code: 'NWT', name: 'Nova Zelândia Turbo' },  // 20 stickers
]
```

Recompile e as figurinhas aparecem automaticamente no álbum.

### Customizar cores/tema

Edite `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        green: '#16a34a',  // cor primária
      }
    }
  }
}
```

## 🚀 Deploy (Vercel)

1. Push para GitHub
2. Conecte repo no [vercel.com](https://vercel.com)
3. Adicione env vars (as `NEXT_PUBLIC_*` são públicas, é ok):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```
4. Deploy automático no merge para main

## 🐛 Troubleshooting

**"Não consigo logar"**
- Verifique se as chaves do `.env.local` estão corretas
- Cheque se Auth está ativado no Firebase Console

**"Mensagem de 'permission-denied'"**
- Verifique as security rules no Firestore
- Certifique-se que está logado
- Reinicie o app

**"Usuário cria conta mas não consegue criar grupo"**
- Cheque se a conta foi criada com sucesso
- Reinicie o navegador ou use outra aba

**Desenvolver offline com emuladores**
- Veja a seção "Firebase Emulators" em [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)

## 📝 Licença

Livre para usar, modificar e distribuir.

## 👤 Desenvolvido

Construído com ❤️ usando Next.js + Firebase
