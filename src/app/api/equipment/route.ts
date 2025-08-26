import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, totalQty, pricePerUnit, category, brand, model } = body

    // Validações
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Nome e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o código já existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { code }
    })

    if (existingEquipment) {
      return NextResponse.json(
        { error: 'Código já existe no sistema' },
        { status: 400 }
      )
    }

    // Criar equipamento
    const equipment = await prisma.equipment.create({
      data: {
        name,
        code,
        description,
        totalQty: totalQty || 0,
        pricePerUnit: pricePerUnit || 0,
        category,
        brand,
        model,
        isAvailable: true
      }
    })

    // Registrar atividade
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ledrental.com' }
    })
    
    if (adminUser) {
      await prisma.activity.create({
        data: {
          type: 'EQUIPMENT_CREATED',
          description: `Equipamento "${name}" (${code}) criado`,
          userId: adminUser.id,
          metadata: {
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            equipmentCode: equipment.code
          }
        }
      })
    }

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
