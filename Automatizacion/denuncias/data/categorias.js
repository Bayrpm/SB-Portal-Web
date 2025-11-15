export const CATEGORIAS = [
  { id: 1, nombre: "Emergencias" },
  { id: 2, nombre: "Violencia y agresiones" },
  { id: 3, nombre: "Robos y daños" },
  { id: 4, nombre: "Drogas" },
  { id: 5, nombre: "Armas" },
  { id: 6, nombre: "Incivilidades" },
  { id: 7, nombre: "Patrullaje municipal" },
  { id: 8, nombre: "Otros" },
];

export const TITULOS_PLANTILLAS = {
  Emergencias: [
    "Accidente vehicular en {direccion}",
    "Incendio en {direccion}",
    "Persona necesita asistencia urgente en {direccion}",
    "Caída de árbol en {direccion}",
    "Fuga de gas en {direccion}",
    "Corte de energía eléctrica en {direccion}",
    "Inundación en {direccion}",
  ],
  "Violencia y agresiones": [
    "Pelea en vía pública en {direccion}",
    "Gritos y amenazas en {direccion}",
    "Agresión física en {direccion}",
    "Violencia doméstica en {direccion}",
    "Grupo causando disturbios en {direccion}",
    "Amenazas a vecinos en {direccion}",
  ],
  "Robos y daños": [
    "Robo a vivienda en {direccion}",
    "Hurto de vehículo en {direccion}",
    "Daños a propiedad privada en {direccion}",
    "Vandalismo en {direccion}",
    "Rayado de muros en {direccion}",
    "Destrucción de mobiliario público en {direccion}",
    "Robo a comercio en {direccion}",
  ],
  Drogas: [
    "Venta de drogas en {direccion}",
    "Consumo de drogas en vía pública en {direccion}",
    "Microtráfico en sector {direccion}",
    "Sospecha de punto de venta en {direccion}",
    "Personas consumiendo sustancias en {direccion}",
  ],
  Armas: [
    "Persona portando arma en {direccion}",
    "Disparos escuchados en {direccion}",
    "Exhibición de arma de fuego en {direccion}",
    "Amenaza con arma blanca en {direccion}",
    "Porte ilegal de armas en {direccion}",
  ],
  Incivilidades: [
    "Ruidos molestos en {direccion}",
    "Consumo de alcohol en vía pública en {direccion}",
    "Música a alto volumen en {direccion}",
    "Desorden público en {direccion}",
    "Ocupación indebida de espacio público en {direccion}",
    "Basura en vía pública en {direccion}",
    "Comercio ambulante irregular en {direccion}",
  ],
  "Patrullaje municipal": [
    "Solicitud de ronda preventiva en {direccion}",
    "Necesidad de patrullaje en sector {direccion}",
    "Control vehicular solicitado en {direccion}",
    "Fiscalización requerida en {direccion}",
    "Apoyo de seguridad municipal en {direccion}",
  ],
  Otros: [
    "Situación irregular en {direccion}",
    "Actividad sospechosa en {direccion}",
    "Problema de seguridad en {direccion}",
    "Solicitud de intervención en {direccion}",
  ],
};

export const DESCRIPCIONES_BASE = {
  Emergencias: [
    "Requiero asistencia urgente. La situación es grave y necesitamos apoyo inmediato de las autoridades.",
    "Se ha producido un incidente y hay personas afectadas. Solicitamos intervención urgente.",
    "Emergencia en curso. Es necesaria la presencia de personal especializado lo antes posible.",
  ],
  "Violencia y agresiones": [
    "Desde hace un tiempo se viene presentando una situación de violencia. Los vecinos estamos preocupados por nuestra seguridad.",
    "Se está desarrollando una situación violenta con personas en riesgo. Necesitamos intervención policial urgente.",
    "Grupo de personas generando conflicto. La situación está escalando y requiere atención inmediata.",
  ],
  "Robos y daños": [
    "Hemos sido víctimas de un delito. Solicitamos presencia policial y levantamiento de denuncia.",
    "Se ha detectado actividad delictual en el sector. Los vecinos necesitamos mayor seguridad.",
    "Daños causados a la propiedad. Esto afecta a toda la comunidad y requiere fiscalización.",
  ],
  Drogas: [
    "Se observa actividad relacionada con drogas en el sector. Los vecinos estamos muy preocupados.",
    "Personas consumiendo sustancias en vía pública frente a menores de edad.",
    "Sospechamos de microtráfico en la zona. Se requiere fiscalización urgente.",
  ],
  Armas: [
    "Se ha visto a personas portando armas. La comunidad está muy alarmada.",
    "Escuchamos disparos. Necesitamos presencia policial inmediata.",
    "Situación de riesgo con armas. Solicitamos intervención urgente.",
  ],
  Incivilidades: [
    "Situación que afecta la convivencia del sector. Solicito intervención municipal.",
    "Problema recurrente que molesta a todos los vecinos. Necesitamos fiscalización.",
    "Uso indebido del espacio público. Requiere control por parte de las autoridades.",
  ],
  "Patrullaje municipal": [
    "Solicitamos mayor presencia de seguridad en el sector por situaciones recurrentes.",
    "Los vecinos necesitamos apoyo preventivo. Agradecemos su colaboración.",
    "Requerimos fiscalización en la zona para prevenir problemas de seguridad.",
  ],
  Otros: [
    "Situación que requiere atención de las autoridades municipales.",
    "Problema que afecta al sector. Solicito intervención.",
    "Necesitamos apoyo para resolver esta situación.",
  ],
};

export const OBSERVACIONES_OPERADOR = [
  "Se asigna con prioridad {prioridad}. Requiere atención en terreno.",
  "Derivada a inspector de turno. Coordinar con vecinos del sector.",
  "Situación reportada por múltiples vecinos. Priorizar atención.",
  "Se requiere fiscalización inmediata según categoría {categoria}.",
  "Asignación por cercanía geográfica. Verificar estado actual.",
  "Caso requiere coordinación con Carabineros. Proceder con cautela.",
  "Atención prioritaria. Informar avances al término de la jornada.",
];

export const OBSERVACIONES_INSPECTOR = {
  Emergencias: [
    "Situación atendida en coordinación con Carabineros. Se resolvió en terreno.",
    "Se verificó emergencia. Derivado a organismo correspondiente.",
    "Asistencia prestada. Situación normalizada.",
    "Personal de emergencia ya se encontraba en el lugar. Se colaboró con procedimiento.",
  ],
  "Violencia y agresiones": [
    "Se constató situación. Carabineros hizo procedimiento.",
    "Vecinos indican que situación es recurrente. Se intensificará patrullaje.",
    "No se encontraron personas al momento de la fiscalización.",
    "Situación ya controlada por Carabineros. Se dejó constancia.",
  ],
  "Robos y daños": [
    "Se verificaron daños. Se tomaron fotografías para registro.",
    "Vecinos confirman hechos. Se aumentará vigilancia en sector.",
    "Propiedad asegurada. Se coordina con PDI para seguimiento.",
    "Denuncia derivada a Carabineros. Se mantiene vigilancia.",
  ],
  Drogas: [
    "Sector fiscalizado. No se detectó actividad al momento de la ronda.",
    "Se informó a Carabineros para operativos especiales.",
    "Vecinos confirman actividad. Se intensificará vigilancia.",
    "Coordinación con OS9 para seguimiento del caso.",
  ],
  Armas: [
    "Carabineros procedió en el lugar. Se dejó constancia.",
    "No se encontraron elementos al momento de fiscalización.",
    "Situación de alto riesgo. Derivado a autoridades policiales.",
    "Se aumentará patrullaje preventivo en el sector.",
  ],
  Incivilidades: [
    "Se conversó con responsables. Compromiso de regular situación.",
    "Fiscalización realizada. Se aplicaron medidas correspondientes.",
    "Vecinos informados sobre canales de denuncia formales.",
    "Situación normalizada. Se mantendrá vigilancia.",
  ],
  "Patrullaje municipal": [
    "Ronda preventiva realizada. Sin novedades en el sector.",
    "Patrullaje intensificado según solicitud. Vecinos conformes.",
    "Control vehicular realizado. Se cursaron infracciones.",
    "Fiscalización completada. Se mantendrá presencia regular.",
  ],
  Otros: [
    "Situación evaluada. Se tomaron medidas pertinentes.",
    "Se verificó en terreno. Caso resuelto.",
    "Derivado a área municipal correspondiente.",
    "Atención prestada según protocolo.",
  ],
};

export const COMENTARIOS_PLANTILLAS = {
  Emergencias: [
    "¿Pudieron atender la emergencia?",
    "Gracias por la rápida respuesta",
    "La situación ya está bajo control",
    "Necesitamos más información sobre lo ocurrido",
    "Agradezco la ayuda prestada",
  ],
  "Violencia y agresiones": [
    "Esto sigue pasando todas las noches",
    "Los vecinos estamos muy preocupados",
    "¿Cuándo van a fiscalizar esto?",
    "Ya hemos llamado varias veces",
    "Agradecemos la intervención policial",
    "La situación es insostenible",
  ],
  "Robos y daños": [
    "A mí también me robaron la semana pasada",
    "El sector está muy inseguro",
    "Necesitamos más cámaras de seguridad",
    "Gracias por tomar la denuncia",
    "Ojalá atrapen a los responsables",
    "Exijo mayor vigilancia",
  ],
  Drogas: [
    "Mis hijos ven esto todos los días",
    "Necesitamos que actúen",
    "Gracias por fiscalizar",
    "¿Cuándo harán operativos?",
    "Esto afecta a toda la comunidad",
  ],
  Armas: [
    "Tenemos mucho miedo",
    "Necesitamos protección urgente",
    "Gracias por intervenir",
    "¿Cuándo habrá más seguridad?",
    "La situación es muy grave",
  ],
  Incivilidades: [
    "No podemos dormir",
    "Esto pasa todos los fines de semana",
    "Gracias por atender",
    "¿Pueden fiscalizar más seguido?",
    "Necesitamos tranquilidad",
    "Agradezco la gestión",
  ],
  "Patrullaje municipal": [
    "Gracias por el patrullaje",
    "Necesitamos más presencia",
    "Los vecinos agradecemos",
    "¿Pueden venir más seguido?",
    "Excelente trabajo",
  ],
  Otros: [
    "Gracias por atender",
    "¿Hay novedades?",
    "Espero se solucione pronto",
    "Agradezco la gestión",
  ],
};
