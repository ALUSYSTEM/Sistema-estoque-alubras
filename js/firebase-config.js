// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCQYL68HqWnDV8ERCJ_u6bwaV5bhSTb6xI",
    authDomain: "alubras-estoque.firebaseapp.com",
    projectId: "alubras-estoque",
    storageBucket: "alubras-estoque.firebasestorage.app",
    messagingSenderId: "994063649697",
    appId: "1:994063649697:web:fd106661920ce884f919e0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências dos serviços
const auth = firebase.auth();
const db = firebase.firestore();

// Configurações do Firestore
db.settings({
    timestampsInSnapshots: true
});

// Função para configurar o Firebase (chamar após obter as credenciais)
function configureFirebase(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) {
    const config = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        storageBucket: storageBucket,
        messagingSenderId: messagingSenderId,
        appId: appId
    };
    
    // Reinicializar com as novas configurações se necessário
    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }
}

// Exportar para uso em outros arquivos
window.firebase = firebase;
window.auth = auth;
window.db = db;
