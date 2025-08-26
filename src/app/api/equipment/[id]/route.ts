import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id }
    })

    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, code, description, totalQty, pricePerUnit, category, brand, model, isAvailable } = body

    // Verificar se o equipamento existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: params.id }
    })

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o código já existe (se foi alterado)
    if (code && code !== existingEquipment.code) {
      const codeExists = await prisma.equipment.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Código já existe no sistema' },
          { status: 400 }
        )
      }
    }

    // Atualizar equipamento
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name,
        code,
        description,
        totalQty,
        pricePerUnit,
        category,
        brand,
        model,
        isAvailable
      }
    })

    // Registrar atividade
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ledrental.com' }
    })
    
    if (adminUser) {
      await prisma.activity.create({
        data: {
          type: 'EQUIPMENT_UPDATED',
          description: `Equipamento "${equipment.name}" (${equipment.code}) atualizado`,
          userId: adminUser.id,
          metadata: {
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            equipmentCode: equipment.code
          }
        }
      })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o equipamento existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: {
        bookingEquipment: true
      }
    })

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há locações ativas para este equipamento
    if (existingEquipment.bookingEquipment.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir equipamento que possui locações ativas' },
        { status: 400 }
      )
    }

    // Deletar equipamento
    await prisma.equipment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Equipamento excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
