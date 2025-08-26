import { NextResponse } from 'next/server'
import { runInventoryMaintenance } from '@/lib/inventory'

export async function POST() {
  try {
    console.log('Iniciando manutenção automática do estoque...')
    
    const expiredCount = await runInventoryMaintenance()
    
    return NextResponse.json({
      success: true,
      message: `Manutenção concluída com sucesso`,
      expiredBookings: expiredCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro na manutenção do estoque:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro na manutenção do estoque',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('Verificando status da manutenção do estoque...')
    
    // Retornar informações sobre o último status de manutenção
    return NextResponse.json({
      success: true,
      message: 'Sistema de manutenção de estoque ativo',
      lastCheck: new Date().toISOString(),
      features: [
        'Verificação automática de locações expiradas',
        'Restauração automática de estoque',
        'Atualização em tempo real de quantidades',
        'Validação de disponibilidade antes da criação'
      ]
    })
  } catch (error) {
    console.error('Erro ao verificar status da manutenção:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao verificar status da manutenção',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
