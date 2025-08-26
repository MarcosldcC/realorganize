import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Testar conexão com o banco
    const equipmentCount = await prisma.equipment.count()
    const allEquipment = await prisma.equipment.findMany()
    
    return NextResponse.json({
      success: true,
      message: 'API de equipamentos funcionando',
      equipmentCount,
      equipment: allEquipment
    })
  } catch (error) {
    console.error('Erro no teste de equipamentos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
