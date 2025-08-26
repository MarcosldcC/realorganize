import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Função para obter companyId da sessão
async function getCompanyIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const sessionId = request.cookies.get('session-id')?.value
    if (!sessionId) return null
    
    const parts = sessionId.split('_')
    if (parts.length < 2) return null
    
    const userId = parts[1]
    if (!userId) return null
    
    // Buscar usuário para obter companyId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    })
    
    return user?.companyId || null
  } catch (error) {
    console.error('Erro ao obter companyId:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyIdFromSession(request)
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const equipment = await prisma.equipment.findMany({
      where: { companyId },
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

    const companyId = await getCompanyIdFromSession(request)
    if (!companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar se o código já existe na empresa
    const existingEquipment = await prisma.equipment.findFirst({
      where: { 
        code,
        companyId
      }
    })

    if (existingEquipment) {
      return NextResponse.json(
        { error: 'Código já existe nesta empresa' },
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
        isAvailable: true,
        companyId
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
