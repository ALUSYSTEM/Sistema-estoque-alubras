# Guia de Configuração Rápida - Sistema de Estoque Firebase

## 🚀 Setup em 5 Passos

### 1. Criar Projeto Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Criar um projeto"**
3. Preencha o nome do projeto (ex: "sistema-estoque")
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 2. Configurar Authentication
1. No menu lateral, clique em **"Authentication"**
2. Vá na aba **"Sign-in method"**
3. Clique em **"Email/Password"**
4. Habilite a primeira opção **"Email/Password"**
5. Clique em **"Salvar"**

### 3. Configurar Firestore Database
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Começar no modo de teste"** (mais fácil para começar)
4. Escolha uma localização (recomendo: southamerica-east1 para Brasil)
5. Clique em **"Concluir"**

### 4. Configurar Regras de Segurança
1. Na aba **"Regras"** do Firestore
2. Substitua o código por este:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publicar"**

> ⚠️ **Atenção**: Esta regra permite acesso total a usuários autenticados. Para produção, use as regras do arquivo `firestore-rules.txt`

### 5. Obter Configurações do Projeto
1. Clique no ícone ⚙️ **"Configurações do projeto"**
2. Role até **"Seus aplicativos"**
3. Clique no ícone **"Web"** `</>`
4. Digite um nome (ex: "estoque-web")
5. **NÃO** marque "Também configurar o Firebase Hosting"
6. Clique em **"Registrar app"**
7. **COPIE** as configurações do `firebaseConfig`

### 6. Configurar o Código
1. Abra o arquivo `js/firebase-config.js`
2. Substitua o conteúdo do `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 7. Executar o Sistema

#### Opção A: Python (Recomendado) - Porta 5003
```bash
python -m http.server 5003
```
Abra: http://localhost:5003

#### Opção B: Node.js - Porta 5003
```bash
npx serve . -l 5003
```

#### Opção C: PHP - Porta 5003
```bash
php -S localhost:5003
```

### 8. Primeiro Acesso
1. O sistema mostrará tela de login
2. **Como não há usuários cadastrados**, você precisa criar o primeiro:
   - Vá no Firebase Console > Authentication > Users
   - Clique em **"Add user"**
   - Digite email e senha
   - Clique em **"Add user"**

3. Volte ao sistema e faça login
4. O sistema criará automaticamente os dados básicos do usuário

## 🔧 Configurações Adicionais Recomendadas

### Habilitar Persistência Offline
Após o primeiro acesso bem-sucedido, o sistema funcionará offline automaticamente.

### Configurar Índices do Firestore
O Firebase criará automaticamente os índices necessários conforme você usar o sistema.

### Backup
O Firebase faz backup automático. Para exportar:
- Firebase Console > Firestore > Import/Export
- Clique em "Exportar"

## ✅ Checklist de Verificação

- [ ] Projeto Firebase criado
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Database criado
- [ ] Regras de segurança configuradas
- [ ] Configurações copiadas para `firebase-config.js`
- [ ] Sistema executando localmente
- [ ] Primeiro usuário criado
- [ ] Login funcionando

## 🆘 Problemas Comuns

### "Erro de configuração do Firebase"
- Verifique se todas as configurações foram copiadas corretamente
- Confirme se não há espaços extras no código

### "Cannot read properties"
- Abra o Console do navegador (F12)
- Verifique se não há erros de JavaScript
- Confirme se o Firebase está inicializado

### "Missing or insufficient permissions"
- Verifique as regras do Firestore
- Confirme se o usuário está autenticado

### Sistema não carrega
- Verifique se está executando em servidor local (não file://)
- Confirme se a conexão com internet está funcionando

## 📞 Suporte
Se encontrar problemas, verifique:
1. Console do navegador (F12 > Console)
2. Se todas as configurações estão corretas
3. Se os serviços Firebase estão habilitados
