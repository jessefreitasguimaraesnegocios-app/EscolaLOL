# 🔥 Configuração do Firebase/Firestore

## 📋 Pré-requisitos

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o **Firestore Database** no seu projeto
3. Configure as regras de segurança do Firestore

## ⚙️ Configuração

### 1. Obter Credenciais do Firebase

1. No Firebase Console, vá em **Project Settings** > **General**
2. Role até **Your apps** e clique em **Web app** (ícone `</>`)
3. Copie as credenciais do Firebase

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Configurar Regras do Firestore

No Firebase Console, vá em **Firestore Database** > **Rules** e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vans collection
    match /vans/{vanId} {
      allow read: if true; // Pode ler qualquer van
      allow write: if request.auth != null; // Só pode escrever se autenticado
    }
    
    // Students collection
    match /students/{studentId} {
      allow read: if true; // Pode ler qualquer estudante
      allow write: if request.auth != null; // Só pode escrever se autenticado
    }
  }
}
```

**⚠️ ATENÇÃO**: Essas regras permitem leitura pública. Para produção, ajuste conforme suas necessidades de segurança.

## 📊 Estrutura do Banco de Dados

### Collection: `vans`

```typescript
{
  id: string,        // ID da van
  lat: number,        // Latitude
  lng: number,       // Longitude
  updatedAt: Timestamp // Data/hora da última atualização
}
```

### Collection: `students`

```typescript
{
  id: string,        // ID do estudante
  lat: number,       // Latitude
  lng: number,       // Longitude
  pickedUp: boolean  // Se foi coletado
}
```

## 🚀 Como Funciona

### Motorista (Driver)

- **Envia GPS a cada 3 segundos** para o Firestore
- A localização é atualizada automaticamente na collection `vans`
- Outros usuários podem ver a localização em tempo real

### Estudante (Passenger)

- Pode enviar sua localização para o Firestore
- A localização é atualizada na collection `students`
- O motorista pode ver a localização em tempo real

### Admin

- Pode ver todas as vans e estudantes em tempo real
- Recebe atualizações automáticas via listeners do Firestore

## 🔧 Serviços Disponíveis

### `firestoreService.ts`

- `updateVanLocation(vanId, lat, lng)` - Atualiza localização da van
- `getVanLocation(vanId)` - Obtém localização da van
- `subscribeToVanLocation(vanId, callback)` - Listener em tempo real
- `subscribeToAllVans(callback)` - Listener para todas as vans
- `updateStudentLocation(studentId, lat, lng)` - Atualiza localização do estudante
- `markStudentPickedUp(studentId, pickedUp)` - Marca estudante como coletado
- `subscribeToStudentLocation(studentId, callback)` - Listener em tempo real
- `subscribeToAllStudents(callback)` - Listener para todos os estudantes
- `subscribeToStudentsByVan(vanId, callback)` - Listener para estudantes de uma van

## 📱 Uso no App

O sistema já está integrado:

1. **DriverInterface**: Envia GPS automaticamente a cada 3 segundos
2. **App.tsx**: Escuta atualizações em tempo real do Firestore
3. **MapEngine**: Mostra localizações atualizadas em tempo real

## 🐛 Troubleshooting

### Erro: "Firebase: Error (auth/configuration-not-found)"

- Verifique se o arquivo `.env` existe e está configurado corretamente
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

### Erro: "Permission denied"

- Verifique as regras do Firestore no Firebase Console
- Certifique-se de que o usuário está autenticado (se necessário)

### GPS não está sendo enviado

- Verifique se o navegador tem permissão de localização
- Verifique o console do navegador para erros
- Certifique-se de que o `vehicle.id` está definido

