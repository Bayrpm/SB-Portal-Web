/**
 * Carga datos necesarios desde Supabase
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Carga todos los ciudadanos
 */
export async function cargarCiudadanos() {
  // IDs específicos de las 50 cuentas generadas
  const ciudadanosIDs = [
    "f08d1d51-2679-4e1d-b793-c1e9cb30b004",
    "756818a9-bcc1-4555-9760-0270ba54b22d",
    "b6417c61-b218-42c5-b2bf-b16ae34bdaab",
    "5363139c-a81f-415a-a7a3-b778364b654f",
    "1ed90477-e3a7-4e9c-a749-60801d153214",
    "498bb0b1-a404-4634-afd0-55aae26e185e",
    "213fa4c5-e773-4990-a3c0-a8d223b06ef2",
    "b0de23bb-136f-4954-bb8b-578a68ded0b3",
    "63939ceb-8a3f-4aff-8677-bd2a8575e8ba",
    "5e330e14-fe25-49a7-8d42-e9d95674cfc3",
    "722d029d-0e88-42ba-8856-6b63ee0c844f",
    "5009fbc5-537f-4f18-9c66-1903e1b2426d",
    "33e66ddd-5c52-427d-9db0-553dfe873d12",
    "7a3ae0da-a5c9-48b4-8a46-ceaf079ecabb",
    "a72fc16c-cca8-4cd9-be1a-82832e8d104b",
    "b04283d0-cd0a-4e0c-ab93-5fc780866ddf",
    "0d6bed3e-5332-441a-ad80-8df6c7b78abc",
    "5ec6016f-7ea3-49ae-b25f-5a3a83bf1c6e",
    "b3127ff9-69ab-4a7e-9db7-d8e54ae07df5",
    "dc2ab048-1afb-415f-a56e-e31990f95eb8",
    "83872911-cb6c-4837-914b-bc36b4cff2fa",
    "1d610713-85ec-46bd-af1c-849f2903cdda",
    "b4f6f9ac-e871-406f-aa69-aa878b3315c8",
    "4f8dccf4-9665-4be7-8585-ba4c5f115376",
    "440d4fb7-f1dc-4b67-bec2-0609d8249073",
    "0cfa2e39-85fe-4e32-850e-6af944ddbf3d",
    "d023befc-dd97-4d56-8a93-905656a46f5a",
    "416e4a51-a4e8-449b-a6a6-26df31f0fd96",
    "c9c80ede-dc01-4149-9dc3-6e77a575558a",
    "1dab18f8-83ac-48ac-982a-0065645c414c",
    "8f620ab0-1548-4c20-844f-bf8188a64200",
    "77aa672b-d7fc-4d4b-8aee-7608b2aec60c",
    "1ad08448-1a16-43ec-b97d-c08759c3caef",
    "3f9581c1-d3df-44e1-aa83-f7cd1ab2854c",
    "09930463-f54c-4951-bbc4-e05d0bbd1280",
    "b32ddd4f-f780-4cac-b416-f2c1ff6cb235",
    "4e958c86-c4d9-4b4f-b2ba-8ee4c1c98c5a",
    "e0c41a0d-5dbb-4123-923b-2fd2faf82018",
    "b8d59049-9750-49a5-a914-56e2e48b2a5d",
    "5359aad2-febe-4109-8feb-15bd92227012",
    "8f9b5bdc-0d54-40f6-85a2-75a6e343739b",
    "8b5bef57-446d-4642-bc88-e737f88cb46f",
    "1eda2092-4576-42f9-9405-79cb98ec194f",
    "6a7e3208-83ae-43ba-af17-c0cd99e27683",
    "7244cb4c-a8ee-499d-8e8b-1b3a16352577",
    "7481372c-4c21-4588-897f-a80ff7466b2c",
    "4c49ffdc-e20c-4c18-8e16-c216e3393930",
    "11e39ec5-68c6-4789-bfec-b3e0dad54ed1",
    "1a0bf96a-9154-40f4-991b-cbb0d5b2f887",
    "1e8c2a71-a23c-4271-a7c1-b5ac83109493",
  ];

  const { data, error } = await supabase
    .from("perfiles_ciudadanos")
    .select("usuario_id, nombre, apellido, email")
    .in("usuario_id", ciudadanosIDs);

  if (error) {
    throw new Error(`Error al cargar ciudadanos: ${error.message}`);
  }

  
  return data;
}

/**
 * Carga todos los inspectores activos
 */
export async function cargarInspectores() {
  // IDs específicos de las 20 cuentas de inspectores generadas
  const inspectoresIDs = [
    "95d3bcfb-30d7-4f68-b0d0-e9d2a7804047",
    "291d1568-956a-4a61-ad7a-7c23f90c3392",
    "340b24f0-bfa7-4fc0-90e0-da242ba728f3",
    "48c3033e-24cf-49a8-b429-896e4be4a7d5",
    "f21a8d8e-c95e-4d23-86cd-75bd01c630b9",
    "5b455610-c69b-492d-a9bc-4e2086ab0f1b",
    "03da825e-75f9-418f-93bc-54a5f07f2601",
    "caa0224a-3221-4ac1-8bb1-5b45912ede3c",
    "e0742ea4-94a6-4b96-893d-74aeb2932805",
    "f214d724-5c0d-49ea-80b2-82cabd42c2eb",
    "68a2553a-11bb-4da1-813a-4397710d423f",
    "e660016b-9fe2-476d-890f-ace85210d7a0",
    "b5ea256d-6d56-4171-841e-8846a089dcac",
    "6d277887-1508-4b78-aa0c-4689f34b93a2",
    "ac13e2ef-c52d-4c09-abdd-6d9fd526fdb4",
    "7fc4c38c-ee5d-40c5-8836-866cac1af959",
    "633bee51-cfe0-48ab-ad56-9d7ca1e96069",
    "39ae20f7-1a0d-46e8-b40c-fee388fe651b",
    "fa7f7f6a-16b8-42a7-8268-4c8ca68e9ad3",
    "97661a54-f9b4-4c2e-ae11-ae535529e12c",
  ];

  const { data, error } = await supabase
    .from("inspectores")
    .select(
      `
      id,
      usuario_id,
      perfiles_ciudadanos (
        nombre,
        apellido,
        email
      )
    `
    )
    .in("usuario_id", inspectoresIDs)
    .eq("activo", true);

  if (error) {
    throw new Error(`Error al cargar inspectores: ${error.message}`);
  }

  // Aplanar estructura
  const inspectores = data.map((i) => ({
    id: i.id,
    usuario_id: i.usuario_id,
    nombre: i.perfiles_ciudadanos.nombre,
    apellido: i.perfiles_ciudadanos.apellido,
    email: i.perfiles_ciudadanos.email,
  }));

  
  return inspectores;
}

/**
 * Carga todos los operadores (usuarios del portal)
 */
export async function cargarOperadores() {
  // IDs específicos de las 15 cuentas de operadores generadas
  const operadoresIDs = [
    "6ebc8d0f-7dca-46cf-af14-0b900f3f6a37",
    "0976acc4-c076-40bc-b45c-0b4459c6e1bc",
    "73bcab09-901d-4ec8-aaec-1346086f42fd",
    "8c00ac8a-f997-4503-bcee-6b71696b522f",
    "ee61d15e-596a-4dc7-a22e-7b084857ea6c",
    "3ca1e54d-5cb3-423e-aba3-f32c94cabc47",
    "67abe71d-60a1-4e94-b56a-1d032fd8cdcc",
    "b91c55f6-5919-43fa-862b-96c9ab625836",
    "6083046d-e7e9-4ab3-9853-7bacfe3e5e57",
    "cdc9f196-8705-45c3-95c1-9b9436a3ed9c",
    "e71cd21d-f003-476f-a1c7-b67da4b286a8",
    "11456c66-25c0-476d-9861-2ba237288879",
    "8a5e0ee7-c1b5-45b5-876f-15f1fb5649b5",
    "fb60b035-abd4-4655-ae60-fb908e0b2790",
    "b92b07e6-fc24-4042-b2ac-4497da60eac1",
  ];

  const { data, error } = await supabase
    .from("usuarios_portal")
    .select("usuario_id, rol_id, activo")
    .in("usuario_id", operadoresIDs)
    .eq("activo", true);

  if (error) {
    throw new Error(`Error al cargar operadores: ${error.message}`);
  }

  
  return data;
}

/**
 * Carga todos los datos necesarios
 */
export async function cargarTodosDatos() {
  

  const [ciudadanos, inspectores, operadores] = await Promise.all([
    cargarCiudadanos(),
    cargarInspectores(),
    cargarOperadores(),
  ]);

  return {
    ciudadanos,
    inspectores,
    operadores,
  };
}

/**
 * Cliente Supabase para uso en otros módulos
 */
export { supabase };
