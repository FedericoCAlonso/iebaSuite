import { describe, it, expect } from 'vitest'
import { migrateProjects } from './useProjectMigration'
import type { Project } from '../types/index'

describe('migrateProjects', () => {
  it('should return the original reference if no projects need migration', () => {
    const projects: Project[] = [
      {
        id: '1',
        nombre: 'Proyecto Normal V2',
        escala: 50,
        grosor_pared_default: 0.15,
        alturaDefault: 2.6,
        clienteId: '',
        electricistaId: 'local',
        estado: 'relevamiento',
        inmueble: { direccion: '', partido: '', provincia: '', uso: 'residencial' },
        suministro: { tension: 220, fases: 1 },
        ambientes: [
          {
            id: 'a1',
            nombre: 'Living',
            sentido: 'horario',
            elementos: [
              { id: 'e1', tipo: 'toma', referencia: 'T1', x: 2.5, y: 3.0, paredIdx: 0, paredPos: 1.2, datos: [], mostrarDato: false }
            ]
          }
        ],
        circuitos: [],
        conexiones: [],
        tableros: [],
        diferenciales: [],
        tramos: [],
        unifilDiagrams: [],
        hojasMaestras: []
      } as unknown as Project
    ]

    const result = migrateProjects(projects)
    expect(result).toBe(projects) // Identity preservation for V2
  })

  it('should migrate legacy V1 meta fields to V2 root flat fields', () => {
    const projects = [
      {
        id: '2',
        nombre: 'Proyecto Legacy V1',
        ownerId: 'profesional123',
        meta: {
          nombre: 'Nombre desde Meta',
          escala: 100,
          grosor_pared_default: 0.20,
          alturaDefault: 3.0
        },
        ambientes: []
      }
    ] as any[]

    const result = migrateProjects(projects)
    expect(result).not.toBe(projects) // New reference

    const migrated = result[0] as any
    expect(migrated.nombre).toBe('Nombre desde Meta')
    expect(migrated.escala).toBe(100)
    expect(migrated.grosor_pared_default).toBe(0.20)
    expect(migrated.alturaDefault).toBe(3.0)
    expect(migrated.electricistaId).toBe('profesional123')
    expect(migrated.ownerId).toBeUndefined()
    expect(migrated.meta).toBeUndefined()
  })

  it('should migrate elements coordinates from pixels to meters if limits are exceeded', () => {
    const projects = [
      {
        id: '3',
        nombre: 'Proyecto Legacy Coordenadas',
        escala: 50,
        grosor_pared_default: 0.15,
        alturaDefault: 2.6,
        ambientes: [
          {
            id: 'a2',
            nombre: 'Cocina',
            sentido: 'horario',
            elementos: [
              // x = 120 (> 100). scale = 50.
              // Conversion: 120 * 50 / 1000 = 6.0
              // y = 80. Conversion: 80 * 50 / 1000 = 4.0
              // paredPos = 1000 (> 40). Conversion: 1000 * 50 / 1000 = 50.0
              { id: 'e2', tipo: 'luz', referencia: 'L1', x: 120, y: 80, paredIdx: 1, paredPos: 1000, datos: [], mostrarDato: false }
            ],
            textos: [
              { id: 't1', texto: 'Nota', x: 200, y: 100, tamano: 12 }
            ]
          }
        ]
      }
    ] as any[]

    const result = migrateProjects(projects)
    expect(result).not.toBe(projects)

    const migratedProject = result[0]
    const migratedAmbiente = migratedProject.ambientes[0]
    const migratedElement = migratedAmbiente.elementos[0]
    const migratedText = migratedAmbiente.textos![0]

    expect(migratedElement.x).toBe(6)
    expect(migratedElement.y).toBe(4)
    expect(migratedElement.paredPos).toBe(50)

    expect(migratedText.x).toBe(10) // 200 * 50 / 1000 = 10
    expect(migratedText.y).toBe(5)  // 100 * 50 / 1000 = 5
  })
})
