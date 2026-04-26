# Firebase Setup para Panini Copa 2026

Siga este guia para configurar Firebase e deixar o app em funcionamento.

## 1. Criar um Projeto Firebase

1. Vá para [firebase.google.com](https://firebase.google.com)
2. Clique em "Get Started"
3. Clique em "Create a project"
4. Nome: `panini-fwc-2026` (ou escolha outro)
5. Desmarque "Enable Google Analytics" (opcional)
6. Clique em "Create project"

## 2. Configurar Authentication

1. No Firebase Console, vá para **Authentication**
2. Clique em "Get started"
3. Clique no método **Email/Password**
4. Ative a opção "Email/Password"
5. Clique em "Save"

## 3. Criar Firestore Database

1. No Firebase Console, vá para **Firestore Database**
2. Clique em "Create database"
3. Inicie em **production mode** (vamos usar security rules)
4. Escolha a localização mais próxima
5. Clique em "Create"

## 4. Configurar Security Rules no Firestore

No Firestore, vá para a aba **Rules** e substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Groups collection
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.createdBy == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }

    // Group members
    match /groupMembers/{document=**} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '-' + resource.data.groupId));
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // User stickers
    match /userStickers/{document=**} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/groupMembers/$(request.auth.uid + '-' + resource.data.groupId));
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Clique em "Publish"

## 5. Obter Credenciais do Firebase

1. No Firebase Console, clique no ícone de engrenagem (Settings)
2. Vá para **Project settings**
3. Vá para a aba **General**
4. Role até encontrar "Your apps" → clique em `</>` (Web)
5. Se não houver uma app web, clique em "Add app" → selecione Web
6. Copie a configuração que aparece (algo como):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "panini-fwc-2026.firebaseapp.com",
  projectId: "panini-fwc-2026",
  storageBucket: "panini-fwc-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 6. Configurar .env.local

1. Na raiz do projeto, copie `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Preencha com os valores do Firebase:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=panini-fwc-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=panini-fwc-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=panini-fwc-2026.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 7. Instalar Dependências

```bash
npm install
```

## 8. Rodar o App

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e comece a usar!

---

## Development com Firebase Emulators (Opcional)

Para testar sem enviar dados ao Firebase:

1. Instale Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Inicie os emuladores:
```bash
firebase emulators:start
```

3. No `.env.local`, adicione:
```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

4. Restart seu app e tudo vai usar os emuladores locais

---

## Troubleshooting

### "auth/invalid-api-key"
- Verifique se as chaves do `.env.local` estão corretas
- As chaves são públicas (começam com NEXT_PUBLIC_), é OK serem expostas

### "permission-denied" no Firestore
- Verif ique as security rules
- Certifique-se de que você está logado (`request.auth != null`)
- Reinicie o app após fazer alterações nas rules

### Usuário não consegue criar grupos
- Verifique se Auth está ativado no Firebase Console
- Verifique se o usuário está criando a conta com a mesma aba (não há sincronização entre abas diferentes)

---

## Estrutura do Firestore

O app cria automaticamente:

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

---

## Deployment no Vercel

1. Faça push do seu código para GitHub
2. Conecte seu repositório no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente no Vercel:
   - Todas as `NEXT_PUBLIC_FIREBASE_*`
4. Deploy automático!

**Importante:** As chaves públicas são seguras de adicionar no Vercel, pois começam com `NEXT_PUBLIC_`. Jamais exponha credenciais de Admin SDK.
