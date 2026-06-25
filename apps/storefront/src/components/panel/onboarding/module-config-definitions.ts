interface Translator {
    (key: string, fallback?: string): string
}

export interface ConfigField {
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'toggle' | 'info' | 'limit_bar' | 'feature_list'
    placeholder?: string
    options?: { value: string; label: string }[]
    infoText?: string
    limitKey?: string
    limitValue?: number | string | null
    limitLabel?: string
    features?: string[]
}

/** Format limit values for display (99999+ → ∞) */
export function formatLimit(val: number | string | null | undefined): string {
    if (val === null || val === undefined) return '—'
    const n = Number(val)
    if (isNaN(n)) return String(val)
    if (n >= 99999) return '∞'
    return n.toLocaleString()
}

export function getModuleConfigFields(
    moduleKey: string,
    t: Translator,
    planLimits: Record<string, number | string | null>,
    tierFeatures?: string[],
): ConfigField[] {
    switch (moduleKey) {
        case 'ecommerce':
            return [
                {
                    key: 'default_currency',
                    label: t('onboarding.config.ecommerce.currency', 'Moneda principal'),
                    type: 'select',
                    options: [
                        { value: 'EUR', label: '€ EUR' },
                        { value: 'CHF', label: 'Fr. CHF' },
                        { value: 'USD', label: '$ USD' },
                        { value: 'GBP', label: '£ GBP' },
                    ],
                },
                {
                    key: 'tax_display_mode',
                    label: t('onboarding.config.ecommerce.tax', 'Modo de impuestos'),
                    type: 'select',
                    options: [
                        { value: 'tax_included', label: t('onboarding.config.ecommerce.taxIncl', 'IVA incluido') },
                        { value: 'tax_excluded', label: t('onboarding.config.ecommerce.taxExcl', 'IVA excluido') },
                    ],
                },
                {
                    key: 'stock_mode',
                    label: t('onboarding.config.ecommerce.stock', 'Gestión de stock'),
                    type: 'select',
                    options: [
                        { value: 'always_in_stock', label: t('onboarding.config.ecommerce.stockAlways', 'Siempre disponible') },
                        { value: 'managed', label: t('onboarding.config.ecommerce.stockManaged', 'Stock gestionado') },
                    ],
                },
                {
                    key: 'min_order_amount',
                    label: t('onboarding.config.ecommerce.minOrder', 'Pedido mínimo (0 = sin mínimo)'),
                    type: 'number',
                    placeholder: '0',
                },
                {
                    key: 'free_shipping_threshold',
                    label: t('onboarding.config.ecommerce.freeShipping', 'Envío gratis a partir de'),
                    type: 'number',
                    placeholder: '50',
                },
                {
                    key: 'low_stock_threshold',
                    label: t('onboarding.config.ecommerce.lowStock', 'Alerta stock bajo (unidades)'),
                    type: 'number',
                    placeholder: '5',
                },
                {
                    key: '_limits_ecommerce_products',
                    label: t('onboarding.config.ecommerce.limitsProducts', 'Productos'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_products)} productos · ${formatLimit(planLimits.max_categories)} categorías`,
                },
                {
                    key: '_limits_ecommerce_orders',
                    label: t('onboarding.config.ecommerce.limitsOrders', 'Pedidos y clientes'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_orders_month)} pedidos/mes · ${formatLimit(planLimits.max_customers)} clientes`,
                },
                ...(tierFeatures ? [{
                    key: '_features_ecommerce',
                    label: t('onboarding.config.ecommerce.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'seo':
            return [
                {
                    key: 'meta_title',
                    label: t('onboarding.config.seo.title', 'Título SEO'),
                    type: 'text',
                    placeholder: t('onboarding.config.seo.titlePh', 'Mi Tienda — Los mejores productos'),
                },
                {
                    key: 'meta_description',
                    label: t('onboarding.config.seo.description', 'Meta descripción'),
                    type: 'text',
                    placeholder: t('onboarding.config.seo.descriptionPh', 'Descubre nuestra selección de productos...'),
                },
                {
                    key: 'google_analytics_id',
                    label: t('onboarding.config.seo.ga', 'Google Analytics ID'),
                    type: 'text',
                    placeholder: 'G-XXXXXXXXXX',
                },
                {
                    key: 'facebook_pixel_id',
                    label: t('onboarding.config.seo.fbPixel', 'Facebook Pixel ID'),
                    type: 'text',
                    placeholder: '123456789012345',
                },
                ...(tierFeatures ? [{
                    key: '_features_seo',
                    label: t('onboarding.config.seo.features', 'Funciones de tu tier'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'rrss':
            return [
                {
                    key: 'social_instagram',
                    label: 'Instagram',
                    type: 'text',
                    placeholder: 'https://instagram.com/tu-tienda',
                },
                {
                    key: 'social_facebook',
                    label: 'Facebook',
                    type: 'text',
                    placeholder: 'https://facebook.com/tu-tienda',
                },
                {
                    key: 'social_tiktok',
                    label: 'TikTok',
                    type: 'text',
                    placeholder: 'https://tiktok.com/@tu-tienda',
                },
                {
                    key: 'social_twitter',
                    label: 'X / Twitter',
                    type: 'text',
                    placeholder: 'https://x.com/tu-tienda',
                },
                ...(tierFeatures ? [{
                    key: '_features_rrss',
                    label: t('onboarding.config.rrss.services', 'Servicios incluidos'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'email_marketing':
            return [
                {
                    key: 'email_sender_name',
                    label: t('onboarding.config.email.senderName', 'Nombre del remitente'),
                    type: 'text',
                    placeholder: t('onboarding.config.email.senderNamePh', 'Mi Tienda'),
                },
                {
                    key: 'store_email',
                    label: t('onboarding.config.email.sender', 'Email de la tienda (remitente)'),
                    type: 'text',
                    placeholder: 'hola@mi-tienda.com',
                },
                {
                    key: 'email_reply_to',
                    label: t('onboarding.config.email.replyTo', 'Responder a (si es diferente)'),
                    type: 'text',
                    placeholder: t('onboarding.config.email.replyToPh', 'soporte@mi-tienda.com'),
                },
                {
                    key: 'announcement_bar_enabled',
                    label: t('onboarding.config.email.barEnabled', 'Activar barra de anuncios'),
                    type: 'toggle',
                },
                {
                    key: 'announcement_bar_text',
                    label: t('onboarding.config.email.announcement', 'Texto de la barra de anuncios'),
                    type: 'text',
                    placeholder: t('onboarding.config.email.announcementPh', '🔥 ¡Envío gratis en pedidos +50€!'),
                },
                {
                    key: 'email_footer_text',
                    label: t('onboarding.config.email.footerText', 'Texto legal al pie de emails'),
                    type: 'text',
                    placeholder: t('onboarding.config.email.footerPh', '© 2026 Mi Tienda. Puedes darte de baja en cualquier momento.'),
                },
                {
                    key: 'email_abandoned_cart_delay',
                    label: t('onboarding.config.email.cartDelay', '¿Cuánto esperar para recordar carrito abandonado?'),
                    type: 'select',
                    options: [
                        { value: '1h', label: t('onboarding.config.email.cartDelay1h', '⏱️ 1 hora — Agresivo') },
                        { value: '3h', label: t('onboarding.config.email.cartDelay3h', '⏱️ 3 horas — Recomendado') },
                        { value: '24h', label: t('onboarding.config.email.cartDelay24h', '⏱️ 24 horas — Suave') },
                    ],
                },
                {
                    key: '_limits_email',
                    label: t('onboarding.config.email.limits', 'Límites de email'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_email_sends_month)} emails/mes · ${formatLimit(planLimits.max_newsletter_subscribers)} suscriptores`,
                },
                ...(tierFeatures ? [{
                    key: '_features_email',
                    label: t('onboarding.config.email.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'chatbot':
            return [
                {
                    key: 'chatbot_name',
                    label: t('onboarding.config.chatbot.name', 'Nombre del asistente'),
                    type: 'text',
                    placeholder: t('onboarding.config.chatbot.namePh', 'Sofía'),
                },
                {
                    key: 'chatbot_tone',
                    label: t('onboarding.config.chatbot.tone', 'Personalidad del asistente'),
                    type: 'select',
                    options: [
                        { value: 'formal', label: t('onboarding.config.chatbot.toneFormal', '🎩 Formal — "Buenos días, ¿en qué puedo asistirle?"') },
                        { value: 'friendly', label: t('onboarding.config.chatbot.toneFriendly', '😊 Amigable — "¡Hola! ¿Cómo te puedo ayudar?"') },
                        { value: 'casual', label: t('onboarding.config.chatbot.toneCasual', '😎 Casual — "¡Hey! ¿Qué necesitas?"') },
                    ],
                },
                {
                    key: 'chatbot_welcome_message',
                    label: t('onboarding.config.chatbot.welcome', 'Mensaje de bienvenida'),
                    type: 'text',
                    placeholder: t('onboarding.config.chatbot.welcomePh', '¡Hola! Soy {name}, ¿en qué puedo ayudarte?'),
                },
                {
                    key: 'chatbot_knowledge_scope',
                    label: t('onboarding.config.chatbot.scope', '¿Sobre qué puede responder el bot?'),
                    type: 'select',
                    options: [
                        { value: 'products_only', label: t('onboarding.config.chatbot.scopeProducts', '📦 Solo productos y precios') },
                        { value: 'products_and_faq', label: t('onboarding.config.chatbot.scopeFaq', '📦💬 Productos + Preguntas frecuentes') },
                        { value: 'full_catalog', label: t('onboarding.config.chatbot.scopeFull', '📦💬📋 Todo: productos, FAQ, políticas, envío') },
                    ],
                },
                {
                    key: 'chatbot_auto_open_delay',
                    label: t('onboarding.config.chatbot.autoOpen', '¿Abrir chat automáticamente?'),
                    type: 'select',
                    options: [
                        { value: '0', label: t('onboarding.config.chatbot.autoOpenNever', '❌ No, solo al hacer click') },
                        { value: '5', label: t('onboarding.config.chatbot.autoOpen5', '⏱️ A los 5 segundos') },
                        { value: '10', label: t('onboarding.config.chatbot.autoOpen10', '⏱️ A los 10 segundos') },
                        { value: '30', label: t('onboarding.config.chatbot.autoOpen30', '⏱️ A los 30 segundos') },
                    ],
                },
                {
                    key: '_limits_chatbot',
                    label: t('onboarding.config.chatbot.limits', 'Capacidad del chatbot'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_chatbot_messages_month)} mensajes/mes`,
                },
            ]

        case 'crm':
            return [
                {
                    key: 'crm_auto_tag_customers',
                    label: t('onboarding.config.crm.autoTag', '¿Añadir clientes automáticamente al CRM?'),
                    type: 'toggle',
                },
                {
                    key: 'crm_new_customer_tag',
                    label: t('onboarding.config.crm.customerTag', 'Etiqueta para clientes nuevos'),
                    type: 'text',
                    placeholder: t('onboarding.config.crm.customerTagPh', 'nuevo'),
                },
                {
                    key: 'crm_notify_new_contact',
                    label: t('onboarding.config.crm.notifyNew', '¿Avisarte cuando llegue un nuevo contacto?'),
                    type: 'toggle',
                },
                {
                    key: '_info_crm_email',
                    label: '',
                    type: 'info',
                    infoText: t('onboarding.config.crm.emailInfo', '📧 Las notificaciones se envían al email configurado en Email Marketing. Puedes cambiarlo desde la sección Configuración.'),
                },
                {
                    key: 'crm_export_format',
                    label: t('onboarding.config.crm.exportFormat', 'Formato de exportación preferido'),
                    type: 'select',
                    options: [
                        { value: 'csv', label: t('onboarding.config.crm.exportCsv', '📄 CSV (compatible con Excel, Google Sheets)') },
                        { value: 'excel', label: t('onboarding.config.crm.exportExcel', '📊 Excel (.xlsx)') },
                    ],
                },
                {
                    key: '_limits_crm',
                    label: t('onboarding.config.crm.limits', 'Capacidad CRM'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_crm_contacts)} contactos`,
                },
                ...(tierFeatures ? [{
                    key: '_features_crm',
                    label: t('onboarding.config.crm.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'pos':
            return [
                {
                    key: 'pos_receipt_header',
                    label: t('onboarding.config.pos.header', 'Cabecera del recibo'),
                    type: 'text',
                    placeholder: t('onboarding.config.pos.headerPh', 'Mi Tienda — ¡Gracias por tu compra!'),
                },
                {
                    key: 'pos_receipt_footer',
                    label: t('onboarding.config.pos.footer', 'Pie del recibo'),
                    type: 'text',
                    placeholder: t('onboarding.config.pos.footerPh', 'Devoluciones: 30 días · Síguenos en @mi-tienda'),
                },
                {
                    key: 'store_address',
                    label: t('onboarding.config.pos.address', 'Dirección (aparece en recibos)'),
                    type: 'text',
                    placeholder: t('onboarding.config.pos.addressPh', 'Calle Principal 1, 28001 Madrid'),
                },
                {
                    key: 'pos_default_payment_method',
                    label: t('onboarding.config.pos.payment', 'Método de pago por defecto'),
                    type: 'select',
                    options: [
                        { value: 'cash', label: t('onboarding.config.pos.cash', '💵 Efectivo') },
                        { value: 'card', label: t('onboarding.config.pos.card', '💳 Tarjeta') },
                        { value: 'transfer', label: t('onboarding.config.pos.transfer', '🏦 Transferencia') },
                    ],
                },
                {
                    key: 'pos_tax_display',
                    label: t('onboarding.config.pos.taxDisplay', '¿Cómo mostrar impuestos en recibos?'),
                    type: 'select',
                    options: [
                        { value: 'tax_included', label: t('onboarding.config.pos.taxIncl', '✅ IVA incluido en precio') },
                        { value: 'tax_excluded', label: t('onboarding.config.pos.taxExcl', '📋 IVA desglosado aparte') },
                    ],
                },
                {
                    key: 'pos_enable_tips',
                    label: t('onboarding.config.pos.tipsToggle', '¿Permitir propinas en el terminal?'),
                    type: 'toggle',
                },
                {
                    key: 'pos_tip_percentages',
                    label: t('onboarding.config.pos.tipPct', 'Porcentajes de propina (separados por comas)'),
                    type: 'text',
                    placeholder: '5, 10, 15, 20',
                },
                {
                    key: 'pos_sound_enabled',
                    label: t('onboarding.config.pos.sound', '¿Sonidos al escanear/cobrar?'),
                    type: 'toggle',
                },
                {
                    key: '_limits_pos',
                    label: t('onboarding.config.pos.limits', 'Capacidad POS'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_pos_payment_methods)} métodos de pago`,
                },
                ...(tierFeatures ? [{
                    key: '_features_pos',
                    label: t('onboarding.config.pos.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'sales_channels':
            return [
                {
                    key: 'whatsapp_number',
                    label: t('onboarding.config.channels.whatsapp', 'Número de WhatsApp'),
                    type: 'text',
                    placeholder: '+34 612 345 678',
                },
                {
                    key: 'sales_whatsapp_greeting',
                    label: t('onboarding.config.channels.greeting', 'Mensaje automático de WhatsApp'),
                    type: 'text',
                    placeholder: t('onboarding.config.channels.greetingPh', 'Hola, me interesa un producto de tu tienda'),
                },
                {
                    key: 'store_phone',
                    label: t('onboarding.config.channels.phone', 'Teléfono de contacto'),
                    type: 'text',
                    placeholder: '+34 912 345 678',
                },
                {
                    key: 'sales_preferred_contact',
                    label: t('onboarding.config.channels.preferred', '¿Cómo quieres que te contacten los clientes?'),
                    type: 'select',
                    options: [
                        { value: 'whatsapp', label: t('onboarding.config.channels.preferredWA', '💬 WhatsApp (más rápido)') },
                        { value: 'phone', label: t('onboarding.config.channels.preferredPhone', '📞 Teléfono') },
                        { value: 'email', label: t('onboarding.config.channels.preferredEmail', '📧 Email') },
                    ],
                },
                {
                    key: 'sales_business_hours_display',
                    label: t('onboarding.config.channels.hours', '¿Mostrar horario de atención?'),
                    type: 'select',
                    options: [
                        { value: 'not_shown', label: t('onboarding.config.channels.hoursNotShown', '❌ No mostrar') },
                        { value: 'weekdays', label: t('onboarding.config.channels.hoursMF', '📅 Lunes a Viernes') },
                        { value: 'full_week', label: t('onboarding.config.channels.hoursFull', '📅 Todos los días') },
                        { value: 'custom', label: t('onboarding.config.channels.hoursCustom', '✏️ Personalizado (configurar después)') },
                    ],
                },
                {
                    key: 'sales_highlight_free_shipping',
                    label: t('onboarding.config.channels.freeShipping', '¿Destacar envío gratis en mensajes WhatsApp?'),
                    type: 'toggle',
                },
                {
                    key: '_limits_channels',
                    label: t('onboarding.config.channels.limits', 'Capacidad Multicanal'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_payment_methods)} métodos de pago · ${formatLimit(planLimits.max_whatsapp_templates)} templates WhatsApp`,
                },
                ...(tierFeatures ? [{
                    key: '_features_channels',
                    label: t('onboarding.config.channels.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'auth_advanced':
            return [
                {
                    key: '_features_auth',
                    label: t('onboarding.config.auth.providers', 'Métodos de autenticación activos'),
                    type: 'feature_list',
                    features: tierFeatures || ['Google OAuth'],
                },
                {
                    key: '_info_auth',
                    label: '',
                    type: 'info',
                    infoText: t('onboarding.config.auth.info', '🔐 Los proveedores de autenticación se activan automáticamente según tu tier. Configura opciones avanzadas desde Ajustes > Auth.'),
                },
            ]

        case 'automation':
            return [
                {
                    key: 'webhook_notification_email',
                    label: t('onboarding.config.automation.email', 'Email para alertas de webhooks'),
                    type: 'text',
                    placeholder: 'dev@mi-tienda.com',
                },
                {
                    key: '_info_automation',
                    label: '',
                    type: 'info',
                    infoText: t('onboarding.config.automation.info', '⚡ Conecta con Zapier, Make o n8n desde la sección Automatizaciones. Tu URL de webhooks estará disponible en el panel.'),
                },
                ...(tierFeatures ? [{
                    key: '_features_automation',
                    label: t('onboarding.config.automation.features', 'Funciones incluidas'),
                    type: 'feature_list' as const,
                    features: tierFeatures,
                }] : []),
            ]

        case 'capacidad':
            return [
                {
                    key: 'traffic_alert_email',
                    label: t('onboarding.config.capacity.email', '¿A quién avisamos cuando se acerquen tus límites?'),
                    type: 'text',
                    placeholder: 'admin@mi-tienda.com',
                },
                {
                    key: 'capacity_warning_threshold_pct',
                    label: t('onboarding.config.capacity.warning', 'Aviso preventivo (% del límite)'),
                    type: 'select',
                    options: [
                        { value: '60', label: t('onboarding.config.capacity.warn60', '60% — Aviso temprano') },
                        { value: '70', label: t('onboarding.config.capacity.warn70', '70% — Recomendado') },
                        { value: '80', label: t('onboarding.config.capacity.warn80', '80%') },
                    ],
                },
                {
                    key: 'capacity_critical_threshold_pct',
                    label: t('onboarding.config.capacity.critical', 'Alerta crítica (% del límite)'),
                    type: 'select',
                    options: [
                        { value: '85', label: t('onboarding.config.capacity.crit85', '85%') },
                        { value: '90', label: t('onboarding.config.capacity.crit90', '90% — Recomendado') },
                        { value: '95', label: t('onboarding.config.capacity.crit95', '95% — Solo emergencias') },
                    ],
                },
                {
                    key: 'capacity_auto_upgrade_interest',
                    label: t('onboarding.config.capacity.autoUpgrade', '¿Avisarme de opciones de ampliación al acercarme al límite?'),
                    type: 'toggle',
                },
                {
                    key: '_limits_capacity_requests',
                    label: t('onboarding.config.capacity.limitsReq', 'Peticiones diarias'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_requests_day)} peticiones/día`,
                },
                {
                    key: '_limits_capacity_storage',
                    label: t('onboarding.config.capacity.limitsStor', 'Almacenamiento'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.storage_limit_mb)} MB`,
                },
                {
                    key: '_limits_capacity_upload',
                    label: t('onboarding.config.capacity.limitsUpload', 'Tamaño máximo por archivo'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_file_upload_mb)} MB/archivo`,
                },
            ]

        case 'i18n':
            return [
                {
                    key: '_info_i18n',
                    label: '',
                    type: 'info',
                    infoText: t('onboarding.config.i18n.info', '🌍 Los idiomas de tu tienda ya se configuraron en el paso anterior. Puedes cambiarlos en cualquier momento desde la sección Idiomas.'),
                },
                {
                    key: '_limits_i18n',
                    label: t('onboarding.config.i18n.limits', 'Capacidad de idiomas'),
                    type: 'limit_bar',
                    limitLabel: `${formatLimit(planLimits.max_languages)} idiomas · ${formatLimit(planLimits.max_currencies)} monedas`,
                },
            ]

        default:
            return [{
                key: '_info',
                label: '',
                type: 'info',
                infoText: t('onboarding.config.default.info', 'Este módulo está activo y listo para usar.'),
            }]
    }
}
