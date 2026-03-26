-- Migration: Expanded Spanish (es) translations for NeuBridge i18n
-- Adds 60+ Spanish translations covering all major UI strings
-- Generated: 2026-03-26

-- Use upsert pattern (string_key + locale is unique) for idempotent re-runs
INSERT INTO i18n_strings (locale, string_key, string_value) VALUES
-- Meals & Nutrition
('es', 'meals.title', 'Registrar Comida'),
('es', 'meals.breakfast', 'Desayuno'),
('es', 'meals.lunch', 'Almuerzo'),
('es', 'meals.dinner', 'Cena'),
('es', 'meals.snack', 'Merienda'),
('es', 'meals.log_meal', 'Registrar Comida'),
('es', 'meals.logged', '¡Registrado!'),
('es', 'meals.tap_what_you_ate', 'Toca lo que comiste'),
('es', 'meals.items_selected', 'seleccionados'),

-- Hydration
('es', 'hydration.title', 'Mantente Hidratado'),
('es', 'hydration.glasses_today', 'vasos'),
('es', 'hydration.of', 'de'),
('es', 'hydration.tap_drink', 'Toca una bebida para registrar'),
('es', 'hydration.great_job', '¡Muy bien manteniéndote hidratado!'),
('es', 'hydration.time_for_water', '¡Hora de tomar agua!'),

-- MIND Diet
('es', 'mind.score', 'Puntuación MIND'),
('es', 'mind.brain_healthy', 'Alimentos para el Cerebro'),
('es', 'mind.limit', 'Alimentos a Limitar'),
('es', 'mind.leafy_greens', 'Vegetales de Hoja Verde'),
('es', 'mind.berries', 'Frutas del Bosque'),
('es', 'mind.nuts', 'Nueces'),
('es', 'mind.fish', 'Pescado'),
('es', 'mind.poultry', 'Pollo'),
('es', 'mind.whole_grains', 'Granos Integrales'),
('es', 'mind.olive_oil', 'Aceite de Oliva'),

-- Companion Pet
('es', 'pet.is_happy', '¡{{name}} está feliz!'),
('es', 'pet.is_proud', '¡{{name}} está muy orgulloso de ti!'),
('es', 'pet.misses_you', '¡{{name}} te extraña!'),
('es', 'pet.feed', 'Alimentar a {{name}}'),
('es', 'pet.play', 'Jugar con {{name}}'),
('es', 'pet.pet', 'Acariciar a {{name}}'),

-- News
('es', 'news.title', 'Noticias de Hoy'),
('es', 'news.no_articles', 'No hay noticias ahora. ¡Vuelve más tarde!'),
('es', 'news.curated_for_you', 'Seleccionadas para ti'),
('es', 'news.bias_checked', 'Revisado por IA para neutralidad'),

-- About
('es', 'about.title', 'Sobre NeuBridge'),
('es', 'about.version', 'Versión'),
('es', 'about.whats_inside', 'Qué Incluye'),
('es', 'about.credits', 'Créditos'),
('es', 'about.visit_website', 'Visitar nuestro sitio web'),
('es', 'about.email_support', 'Correo de soporte'),
('es', 'about.privacy_policy', 'Política de Privacidad'),
('es', 'about.terms_of_service', 'Términos de Servicio'),

-- Daily Guides
('es', 'guides.title', 'Guías Diarias'),
('es', 'guides.step', 'Paso'),
('es', 'guides.all_done', '¡Todo Listo!'),
('es', 'guides.next_step', 'Siguiente Paso'),
('es', 'guides.getting_dressed', 'Vestirse'),
('es', 'guides.brushing_teeth', 'Cepillarse los Dientes'),
('es', 'guides.simple_meal', 'Preparar una Comida Sencilla'),
('es', 'guides.taking_meds', 'Tomar Medicamentos'),
('es', 'guides.using_phone', 'Usar el Teléfono'),
('es', 'guides.going_walk', 'Salir a Caminar'),
('es', 'guides.preparing_bed', 'Prepararse para Dormir'),
('es', 'guides.washing_hands', 'Lavarse las Manos'),

-- Driving Assessment
('es', 'driving.title', 'Revisión de Seguridad al Conducir'),
('es', 'driving.disclaimer', 'Esta no es una evaluación médica. Siempre consulte a su médico sobre la seguridad al conducir.'),
('es', 'driving.reaction_time', 'Tiempo de Reacción'),
('es', 'driving.tap_green', '¡Toca cuando veas VERDE!'),
('es', 'driving.sign_recognition', 'Reconocimiento de Señales'),
('es', 'driving.results', 'Resultados'),
('es', 'driving.share_caregiver', 'Compartir con Cuidador'),

-- Additional Common
('es', 'common.next', 'Siguiente'),
('es', 'common.welcome', 'Bienvenido'),
('es', 'common.back', 'Atrás'),
('es', 'common.share', 'Compartir'),
('es', 'common.close', 'Cerrar'),
('es', 'common.yes', 'Sí'),
('es', 'common.no', 'No'),
('es', 'common.ok', 'Aceptar'),
('es', 'common.more', 'Más'),
('es', 'common.less', 'Menos')
ON CONFLICT (string_key, locale) DO UPDATE SET string_value = EXCLUDED.string_value;

-- Update Spanish locale completion percentage
UPDATE supported_locales SET completion_pct = 95, is_active = true WHERE code = 'es';
