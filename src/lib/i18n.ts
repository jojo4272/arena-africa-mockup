// Multi-language translation system
// Supports: English (en), Swahili (sw), French (fr), Portuguese (pt)

export type Locale = "en" | "sw" | "fr" | "pt";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  sw: "Kiswahili",
  fr: "Français",
  pt: "Português",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  sw: "🇰🇪",
  fr: "🇫🇷",
  pt: "🇵🇹",
};

type TranslationDict = {
  // Navigation
  nav_markets: string;
  nav_chamas: string;
  nav_wallet: string;
  nav_profile: string;
  nav_ussd: string;
  nav_mobile: string;
  
  // Markets
  markets_title: string;
  markets_subtitle: string;
  markets_featured: string;
  markets_all: string;
  markets_sports: string;
  markets_politics: string;
  markets_economy: string;
  markets_culture: string;
  markets_crypto: string;
  markets_tech: string;
  markets_climate: string;
  markets_global: string;
  markets_predict_yes: string;
  markets_predict_no: string;
  markets_odds: string;
  markets_volume: string;
  markets_ends: string;
  markets_resolved: string;
  markets_resolved_as: string;
  markets_create: string;
  markets_search: string;
  
  // Predictions
  predict_title: string;
  predict_amount: string;
  predict_outcome: string;
  predict_potential: string;
  predict_balance: string;
  predict_confirm: string;
  predict_cancel: string;
  predict_success: string;
  predict_error: string;
  predict_min: string;
  
  // Wallet
  wallet_title: string;
  wallet_balance: string;
  wallet_deposit: string;
  wallet_withdraw: string;
  wallet_transactions: string;
  wallet_provider: string;
  wallet_phone: string;
  wallet_amount: string;
  wallet_stk_push: string;
  wallet_success: string;
  wallet_error: string;
  wallet_reference: string;
  wallet_mpesa: string;
  wallet_mtn: string;
  wallet_airtel: string;
  
  // Chamas
  chama_title: string;
  chama_subtitle: string;
  chama_create: string;
  chama_join: string;
  chama_name: string;
  chama_code: string;
  chama_contribution: string;
  chama_total: string;
  chama_backing: string;
  chama_market: string;
  chama_success: string;
  chama_error: string;
  
  // USSD
  ussd_title: string;
  ussd_subtitle: string;
  ussd_input: string;
  ussd_send: string;
  ussd_reset: string;
  ussd_session: string;
  ussd_dialed: string;
  ussd_tip: string;
  
  // Common
  common_cancel: string;
  common_confirm: string;
  common_save: string;
  common_loading: string;
  common_success: string;
  common_error: string;
  common_yes: string;
  common_no: string;
  common_welcome: string;
  common_select: string;
  common_enter: string;
  common_processing: string;
  
  // Hero / Landing
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  hero_feature_ussd: string;
  hero_feature_mp: string;
  hero_feature_chama: string;
  
  // Profile
  profile_switch: string;
  profile_connected: string;
  profile_logged_as: string;
  
  // Status
  status_open: string;
  status_resolved: string;
  status_won: string;
  status_lost: string;
  status_pending: string;
};

const translations: Record<Locale, TranslationDict> = {
  en: {
    nav_markets: "Markets",
    nav_chamas: "Chamas",
    nav_wallet: "Wallet",
    nav_profile: "Profile",
    nav_ussd: "USSD",
    nav_mobile: "Mobile App",
    
    markets_title: "Live Prediction Markets",
    markets_subtitle: "Place your prediction with instant odds payouts",
    markets_featured: "High Yield",
    markets_all: "All Markets",
    markets_sports: "Sports",
    markets_politics: "Politics",
    markets_economy: "Economy",
    markets_culture: "Culture",
    markets_crypto: "Crypto",
    markets_tech: "Technology",
    markets_climate: "Climate",
    markets_global: "Global",
    markets_predict_yes: "Predict YES",
    markets_predict_no: "Predict NO",
    markets_odds: "Odds",
    markets_volume: "Volume",
    markets_ends: "Ends",
    markets_resolved: "Resolved",
    markets_resolved_as: "Resolved as",
    markets_create: "Create Market",
    markets_search: "Search markets...",
    
    predict_title: "Place Prediction",
    predict_amount: "Prediction Amount",
    predict_outcome: "Prediction Outcome",
    predict_potential: "Potential Payout",
    predict_balance: "Wallet Balance",
    predict_confirm: "Confirm & Commit",
    predict_cancel: "Cancel",
    predict_success: "Prediction placed successfully!",
    predict_error: "Failed to place prediction",
    predict_min: "Minimum prediction is 100",
    
    wallet_title: "Mobile Money Wallet",
    wallet_balance: "Balance",
    wallet_deposit: "Deposit",
    wallet_withdraw: "Withdraw",
    wallet_transactions: "Transactions",
    wallet_provider: "Mobile Money Provider",
    wallet_phone: "Phone Number",
    wallet_amount: "Amount",
    wallet_stk_push: "Initiate STK Push",
    wallet_success: "Transaction successful",
    wallet_error: "Transaction failed",
    wallet_reference: "Reference",
    wallet_mpesa: "M-Pesa",
    wallet_mtn: "MTN MoMo",
    wallet_airtel: "Airtel Money",
    
    chama_title: "Chama Predictive Pools",
    chama_subtitle: "Communal prediction pools with friends",
    chama_create: "Start New Chama",
    chama_join: "Join Chama Code",
    chama_name: "Chama Name",
    chama_code: "Invite Code",
    chama_contribution: "Contribution",
    chama_total: "Total Pooled",
    chama_backing: "Backing",
    chama_market: "Target Market",
    chama_success: "Chama created successfully",
    chama_error: "Failed to create Chama",
    
    ussd_title: "USSD Simulator",
    ussd_subtitle: "Dial *384# for offline predictions",
    ussd_input: "Enter Input",
    ussd_send: "Send",
    ussd_reset: "Reset USSD",
    ussd_session: "Active Session",
    ussd_dialed: "Dialed: *384#",
    ussd_tip: "Tip: Interact with the phone to place bets offline",
    
    common_cancel: "Cancel",
    common_confirm: "Confirm",
    common_save: "Save",
    common_loading: "Loading...",
    common_success: "Success",
    common_error: "Error",
    common_yes: "Yes",
    common_no: "No",
    common_welcome: "Welcome",
    common_select: "Select",
    common_enter: "Enter",
    common_processing: "Processing...",
    
    hero_title: "Africa & Global Peer-to-Peer Prediction Market",
    hero_subtitle: "Bringing prediction markets to 1.4 billion Africans and the world",
    hero_tagline: "Empowering the Unbanked",
    hero_feature_ussd: "USSD Channel",
    hero_feature_mp: "M-Pesa STK Push",
    hero_feature_chama: "Chama Collective Capital",
    
    profile_switch: "Switch Demo Profile",
    profile_connected: "Connected",
    profile_logged_as: "Logged in via Phone",
    
    status_open: "Open",
    status_resolved: "Resolved",
    status_won: "Won",
    status_lost: "Lost",
    status_pending: "Pending",
  },
  
  sw: {
    nav_markets: "Masoko",
    nav_chamas: "Vyama",
    nav_wallet: "Pochi",
    nav_profile: "Wasifu",
    nav_ussd: "USSD",
    nav_mobile: "Programu ya Simu",
    
    markets_title: "Masoko ya Utabiri ya Moja kwa Moja",
    markets_subtitle: "Weka utabiri wako na malipo ya haraka ya uwezekano",
    markets_featured: "Faida Kubwa",
    markets_all: "Masoko Yote",
    markets_sports: "Michezo",
    markets_politics: "Siasa",
    markets_economy: "Uchumi",
    markets_culture: "Utamaduni",
    markets_crypto: "Kripto",
    markets_tech: "Teknolojia",
    markets_climate: "Hali ya Hewa",
    markets_global: "Duniani Kote",
    markets_predict_yes: "Tabiri NDIO",
    markets_predict_no: "Tabiri HAPANA",
    markets_odds: "Uwezekano",
    markets_volume: "Kiasi",
    markets_ends: "Inaisha",
    markets_resolved: "Imeisha",
    markets_resolved_as: "Imeamuliwa kama",
    markets_create: "Tengeneza Soko",
    markets_search: "Tafuta masoko...",
    
    predict_title: "Weka Utabiri",
    predict_amount: "Kiasi cha Utabiri",
    predict_outcome: "Matokeo ya Utabiri",
    predict_potential: "Malipo Yanayoweza Kupatikana",
    predict_balance: "Salio la Pochi",
    predict_confirm: "Thibitisha na Wasilisha",
    predict_cancel: "Ghairi",
    predict_success: "Utabiri umewekwa kikamilifu!",
    predict_error: "Imeshindwa kuweka utabiri",
    predict_min: "Kiwango cha chini cha utabiri ni 100",
    
    wallet_title: "Pochi ya Pesa ya Simu",
    wallet_balance: "Salio",
    wallet_deposit: "Weka Pesa",
    wallet_withdraw: "Toa Pesa",
    wallet_transactions: "Shughuli",
    wallet_provider: "Mtoa Huduma wa Pesa ya Simu",
    wallet_phone: "Namba ya Simu",
    wallet_amount: "Kiasi",
    wallet_stk_push: "Anzisha STK Push",
    wallet_success: "Shughuli imefanikiwa",
    wallet_error: "Shughuli imeshindikana",
    wallet_reference: "Marejeleo",
    wallet_mpesa: "M-Pesa",
    wallet_mtn: "MTN MoMo",
    wallet_airtel: "Airtel Money",
    
    chama_title: "Makundi ya Utabiri ya Chama",
    chama_subtitle: "Makundi ya utabiri ya pamoja na marafiki",
    chama_create: "Anza Chama Kipya",
    chama_join: "Jiunge na Msimbo wa Chama",
    chama_name: "Jina la Chama",
    chama_code: "Msimbo wa Mwaliko",
    chama_contribution: "Mchango",
    chama_total: "Jumla ya Mkusanyiko",
    chama_backing: "Kuunga Mkono",
    chama_market: "Soko Lengwa",
    chama_success: "Chama kimeundwa kikamilifu",
    chama_error: "Imeshindwa kuunda Chama",
    
    ussd_title: "Kifaa cha USSD",
    ussd_subtitle: "Piga *384# kwa utabiri nje ya mtandao",
    ussd_input: "Ingiza Nambari",
    ussd_send: "Tuma",
    ussd_reset: "Weka Upya USSD",
    ussd_session: "Kipindi Kinachoendelea",
    ussd_dialed: "Pigwa: *384#",
    ussd_tip: "Kidokezo: Tumia simu kuweka dau nje ya mtandao",
    
    common_cancel: "Ghairi",
    common_confirm: "Thibitisha",
    common_save: "Hifadhi",
    common_loading: "Inapakia...",
    common_success: "Imefanikiwa",
    common_error: "Hitilafu",
    common_yes: "Ndio",
    common_no: "Hapana",
    common_welcome: "Karibu",
    common_select: "Chagua",
    common_enter: "Ingiza",
    common_processing: "Inachakata...",
    
    hero_title: "Soko Kuu la Utabiri wa Mtu kwa Mtu - Afrika na Dunia",
    hero_subtitle: "Kuiletea masoko ya utabiri zaidi ya Waafrika bilioni 1.4 na dunia",
    hero_tagline: "Kuwawezesha Wasio na Benki",
    hero_feature_ussd: "Njia ya USSD",
    hero_feature_mp: "M-Pesa STK Push",
    hero_feature_chama: "Mtaji wa Pamoja wa Chama",
    
    profile_switch: "Badilisha Wasifu wa Onyesho",
    profile_connected: "Imeunganishwa",
    profile_logged_as: "Umeingia kupitia Simu",
    
    status_open: "Wazi",
    status_resolved: "Imeisha",
    status_won: "Umeshinda",
    status_lost: "Umepoteza",
    status_pending: "Inasubiri",
  },
  
  fr: {
    nav_markets: "Marchés",
    nav_chamas: "Chamas",
    nav_wallet: "Portefeuille",
    nav_profile: "Profil",
    nav_ussd: "USSD",
    nav_mobile: "App Mobile",
    
    markets_title: "Marchés de Prédiction en Direct",
    markets_subtitle: "Placez votre prédiction avec des gains instantanés",
    markets_featured: "Rendement Élevé",
    markets_all: "Tous les Marchés",
    markets_sports: "Sports",
    markets_politics: "Politique",
    markets_economy: "Économie",
    markets_culture: "Culture",
    markets_crypto: "Crypto",
    markets_tech: "Technologie",
    markets_climate: "Climat",
    markets_global: "Mondial",
    markets_predict_yes: "Prédire OUI",
    markets_predict_no: "Prédire NON",
    markets_odds: "Cotes",
    markets_volume: "Volume",
    markets_ends: "Se termine",
    markets_resolved: "Résolu",
    markets_resolved_as: "Résolu en",
    markets_create: "Créer un Marché",
    markets_search: "Rechercher des marchés...",
    
    predict_title: "Placer une Prédiction",
    predict_amount: "Montant de la Prédiction",
    predict_outcome: "Résultat de la Prédiction",
    predict_potential: "Gain Potentiel",
    predict_balance: "Solde du Portefeuille",
    predict_confirm: "Confirmer et Valider",
    predict_cancel: "Annuler",
    predict_success: "Prédiction placée avec succès !",
    predict_error: "Échec de la prédiction",
    predict_min: "La prédiction minimale est de 100",
    
    wallet_title: "Portefeuille Mobile Money",
    wallet_balance: "Solde",
    wallet_deposit: "Dépôt",
    wallet_withdraw: "Retrait",
    wallet_transactions: "Transactions",
    wallet_provider: "Fournisseur Mobile Money",
    wallet_phone: "Numéro de Téléphone",
    wallet_amount: "Montant",
    wallet_stk_push: "Lancer STK Push",
    wallet_success: "Transaction réussie",
    wallet_error: "Transaction échouée",
    wallet_reference: "Référence",
    wallet_mpesa: "M-Pesa",
    wallet_mtn: "MTN MoMo",
    wallet_airtel: "Airtel Money",
    
    chama_title: "Groupes de Prédiction Chama",
    chama_subtitle: "Groupes de prédiction communautaires avec des amis",
    chama_create: "Créer un Nouveau Chama",
    chama_join: "Rejoindre un Code Chama",
    chama_name: "Nom du Chama",
    chama_code: "Code d'Invitation",
    chama_contribution: "Contribution",
    chama_total: "Total Collecté",
    chama_backing: "Soutient",
    chama_market: "Marché Cible",
    chama_success: "Chama créé avec succès",
    chama_error: "Échec de la création du Chama",
    
    ussd_title: "Simulateur USSD",
    ussd_subtitle: "Composez *384# pour des prédictions hors ligne",
    ussd_input: "Entrer l'Entrée",
    ussd_send: "Envoyer",
    ussd_reset: "Réinitialiser USSD",
    ussd_session: "Session Active",
    ussd_dialed: "Composé : *384#",
    ussd_tip: "Astuce : Interagissez avec le téléphone pour parier hors ligne",
    
    common_cancel: "Annuler",
    common_confirm: "Confirmer",
    common_save: "Enregistrer",
    common_loading: "Chargement...",
    common_success: "Succès",
    common_error: "Erreur",
    common_yes: "Oui",
    common_no: "Non",
    common_welcome: "Bienvenue",
    common_select: "Sélectionner",
    common_enter: "Entrer",
    common_processing: "Traitement...",
    
    hero_title: "Marché de Prédiction Pair-à-Pair Afrique & Monde",
    hero_subtitle: "Apporter les marchés de prédiction à 1,4 milliard d'Africains et au monde",
    hero_tagline: "Autonomiser les Non-Bancarisés",
    hero_feature_ussd: "Canal USSD",
    hero_feature_mp: "M-Pesa STK Push",
    hero_feature_chama: "Capital Collectif Chama",
    
    profile_switch: "Changer de Profil Démo",
    profile_connected: "Connecté",
    profile_logged_as: "Connecté via Téléphone",
    
    status_open: "Ouvert",
    status_resolved: "Résolu",
    status_won: "Gagné",
    status_lost: "Perdu",
    status_pending: "En attente",
  },
  
  pt: {
    nav_markets: "Mercados",
    nav_chamas: "Chamas",
    nav_wallet: "Carteira",
    nav_profile: "Perfil",
    nav_ussd: "USSD",
    nav_mobile: "App Móvel",
    
    markets_title: "Mercados de Previsão ao Vivo",
    markets_subtitle: "Faça sua previsão com pagamentos instantâneos",
    markets_featured: "Alto Rendimento",
    markets_all: "Todos os Mercados",
    markets_sports: "Esportes",
    markets_politics: "Política",
    markets_economy: "Economia",
    markets_culture: "Cultura",
    markets_crypto: "Cripto",
    markets_tech: "Tecnologia",
    markets_climate: "Clima",
    markets_global: "Global",
    markets_predict_yes: "Prever SIM",
    markets_predict_no: "Prever NÃO",
    markets_odds: "Odds",
    markets_volume: "Volume",
    markets_ends: "Termina",
    markets_resolved: "Resolvido",
    markets_resolved_as: "Resolvido como",
    markets_create: "Criar Mercado",
    markets_search: "Pesquisar mercados...",
    
    predict_title: "Fazer Previsão",
    predict_amount: "Valor da Previsão",
    predict_outcome: "Resultado da Previsão",
    predict_potential: "Pagamento Potencial",
    predict_balance: "Saldo da Carteira",
    predict_confirm: "Confirmar e Enviar",
    predict_cancel: "Cancelar",
    predict_success: "Previsão feita com sucesso!",
    predict_error: "Falha ao fazer previsão",
    predict_min: "Previsão mínima é 100",
    
    wallet_title: "Carteira Mobile Money",
    wallet_balance: "Saldo",
    wallet_deposit: "Depositar",
    wallet_withdraw: "Sacar",
    wallet_transactions: "Transações",
    wallet_provider: "Provedor Mobile Money",
    wallet_phone: "Número de Telefone",
    wallet_amount: "Valor",
    wallet_stk_push: "Iniciar STK Push",
    wallet_success: "Transação bem-sucedida",
    wallet_error: "Transação falhou",
    wallet_reference: "Referência",
    wallet_mpesa: "M-Pesa",
    wallet_mtn: "MTN MoMo",
    wallet_airtel: "Airtel Money",
    
    chama_title: "Grupos de Previsão Chama",
    chama_subtitle: "Grupos de previsão comunitários com amigos",
    chama_create: "Criar Novo Chama",
    chama_join: "Entrar no Código Chama",
    chama_name: "Nome do Chama",
    chama_code: "Código de Convite",
    chama_contribution: "Contribuição",
    chama_total: "Total Arrecadado",
    chama_backing: "Apoiando",
    chama_market: "Mercado Alvo",
    chama_success: "Chama criado com sucesso",
    chama_error: "Falha ao criar Chama",
    
    ussd_title: "Simulador USSD",
    ussd_subtitle: "Marque *384# para previsões offline",
    ussd_input: "Digite Entrada",
    ussd_send: "Enviar",
    ussd_reset: "Reiniciar USSD",
    ussd_session: "Sessão Ativa",
    ussd_dialed: "Discado: *384#",
    ussd_tip: "Dica: Interaja com o telefone para apostar offline",
    
    common_cancel: "Cancelar",
    common_confirm: "Confirmar",
    common_save: "Salvar",
    common_loading: "Carregando...",
    common_success: "Sucesso",
    common_error: "Erro",
    common_yes: "Sim",
    common_no: "Não",
    common_welcome: "Bem-vindo",
    common_select: "Selecionar",
    common_enter: "Digite",
    common_processing: "Processando...",
    
    hero_title: "Mercado de Previsão P2P África & Global",
    hero_subtitle: "Levando mercados de previsão para 1,4 bilhão de africanos e o mundo",
    hero_tagline: "Capacitando os Não-Bancarizados",
    hero_feature_ussd: "Canal USSD",
    hero_feature_mp: "M-Pesa STK Push",
    hero_feature_chama: "Capital Coletivo Chama",
    
    profile_switch: "Mudar Perfil Demo",
    profile_connected: "Conectado",
    profile_logged_as: "Conectado via Telefone",
    
    status_open: "Aberto",
    status_resolved: "Resolvido",
    status_won: "Ganhou",
    status_lost: "Perdeu",
    status_pending: "Pendente",
  },
};

export function getTranslations(locale: Locale): TranslationDict {
  return translations[locale] || translations.en;
}

export function t(locale: Locale, key: keyof TranslationDict): string {
  const dict = getTranslations(locale);
  return dict[key] || translations.en[key] || key;
}
