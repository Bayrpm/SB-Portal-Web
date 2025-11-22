-- Script para corregir el acceso del Operador
-- Solo debe tener acceso a: Denuncias, Derivaciones, Mapa
-- NO debe tener acceso a: Usuarios, Inspectores, Categorías

-- Obtener el rol_id del Operador
DO $$
DECLARE
  operador_rol_id INT;
BEGIN
  SELECT id INTO operador_rol_id FROM roles_portal WHERE id = 2 LIMIT 1;
  
  IF operador_rol_id IS NULL THEN
    RAISE NOTICE 'No se encontró el rol de Operador (ID=2).';
  ELSE
    -- Eliminar TODAS las asignaciones del Operador primero
    DELETE FROM roles_paginas WHERE rol_id = operador_rol_id;
    
    -- Asignar SOLO las 3 páginas permitidas
    INSERT INTO roles_paginas (rol_id, pagina_id)
    SELECT operador_rol_id, id FROM paginas 
    WHERE nombre IN ('denuncias', 'derivaciones', 'mapa')
    AND activo = true;
    
    RAISE NOTICE 'Operador (ID: %) ahora solo tiene acceso a: Denuncias, Derivaciones, Mapa', operador_rol_id;
  END IF;
END $$;

-- Verificar el resultado
SELECT 
  r.nombre as rol,
  p.nombre as pagina_nombre,
  p.titulo,
  p.path
FROM roles_portal r
JOIN roles_paginas rp ON r.id = rp.rol_id
JOIN paginas p ON rp.pagina_id = p.id
WHERE r.id = 2
ORDER BY p.path;
