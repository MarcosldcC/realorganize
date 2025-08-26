import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da locação é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar detalhes completos da locação
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        },
        accessories: {
          include: {
            accessory: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Locação não encontrada' },
        { status: 404 }
      )
    }

    // Buscar dados da empresa
    const companySettings = await prisma.companySetting.findFirst({
      where: { id: '1' }
    })

    // Gerar PDF do contrato
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      // PDF gerado com sucesso
    })

    // Cabeçalho do contrato
    doc.fontSize(20).text('CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS', { align: 'center' })
    doc.moveDown()
    
    // Dados da empresa
    if (companySettings) {
      doc.fontSize(12).text(`${companySettings.name}`, { align: 'center' })
      doc.fontSize(10).text(`CNPJ: ${companySettings.cnpj}`, { align: 'center' })
      doc.fontSize(10).text(`Endereço: ${companySettings.address}`, { align: 'center' })
      doc.fontSize(10).text(`Telefone: ${companySettings.phone}`, { align: 'center' })
      doc.fontSize(10).text(`Email: ${companySettings.email}`, { align: 'center' })
    }
    
    doc.moveDown(2)
    
    // Dados do cliente
    doc.fontSize(14).text('DADOS DO CLIENTE:', { underline: true })
    doc.fontSize(12).text(`Nome: ${booking.client.name}`)
    doc.fontSize(12).text(`Email: ${booking.client.email}`)
    doc.fontSize(12).text(`Telefone: ${booking.client.phone}`)
    doc.fontSize(12).text(`Documento: ${booking.client.document || 'N/A'}`)
    if (booking.client.company) {
      doc.fontSize(12).text(`Empresa: ${booking.client.company}`)
    }
    if (booking.client.address) {
      doc.fontSize(12).text(`Endereço: ${booking.client.address}`)
    }
    
    doc.moveDown(2)
    
    // Dados do evento
    doc.fontSize(14).text('DADOS DO EVENTO:', { underline: true })
    doc.fontSize(12).text(`Título: ${booking.eventTitle}`)
    doc.fontSize(12).text(`Data de Início: ${new Date(booking.startDate).toLocaleDateString('pt-BR')}`)
    doc.fontSize(12).text(`Data de Fim: ${new Date(booking.endDate).toLocaleDateString('pt-BR')}`)

    
    doc.moveDown(2)
    
    // Equipamentos locados
    doc.fontSize(14).text('EQUIPAMENTOS LOCADOS:', { underline: true })
    
    if (booking.items.length > 0) {
      doc.fontSize(12).text('Painéis de LED:')
      booking.items.forEach((item, index) => {
        doc.fontSize(10).text(`  ${index + 1}. ${item.product.name} (${item.product.code}) - ${item.meters}m`)
      })
    }
    
    if (booking.accessories.length > 0) {
      doc.moveDown()
      doc.fontSize(12).text('Acessórios:')
      booking.accessories.forEach((item, index) => {
        doc.fontSize(10).text(`  ${index + 1}. ${item.accessory.name} (${item.accessory.code}) - ${item.qty} unidade(s)`)
      })
    }
    
    doc.moveDown(2)
    
    // Valores
    doc.fontSize(14).text('VALORES:', { underline: true })
    doc.fontSize(12).text(`Valor Total: R$ ${Number((booking as any).totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    doc.fontSize(12).text(`Status do Pagamento: ${getPaymentStatusText(booking.paymentStatus)}`)
    
    doc.moveDown(2)
    
    // Condições
    doc.fontSize(14).text('CONDIÇÕES GERAIS:', { underline: true })
    doc.fontSize(10).text('1. O cliente é responsável pela integridade dos equipamentos durante o período de locação.')
    doc.fontSize(10).text('2. Danos aos equipamentos serão cobrados conforme tabela de preços.')
    doc.fontSize(10).text('3. A montagem e desmontagem são responsabilidade da empresa locadora.')
    doc.fontSize(10).text('4. Este contrato é válido apenas para o período especificado.')
    doc.fontSize(10).text('5. Cancelamentos devem ser comunicados com antecedência mínima de 48 horas.')
    
    doc.moveDown(2)
    
    // Assinaturas
    doc.fontSize(14).text('ASSINATURAS:', { underline: true })
    doc.moveDown()
    doc.fontSize(10).text('_________________________')
    doc.fontSize(10).text('Cliente')
    doc.moveDown()
    doc.fontSize(10).text('_________________________')
    doc.fontSize(10).text('Representante da Empresa')
    
    // Data e local
    doc.moveDown(2)
    const today = new Date()
    doc.fontSize(10).text(`Data: ${today.toLocaleDateString('pt-BR')}`)
    doc.fontSize(10).text(`Local: ${companySettings?.address || 'São Paulo/SP'}`)
    
    doc.end()

    // Aguardar a geração do PDF
    const pdfBuffer = Buffer.concat(chunks)

    // Retornar o PDF como resposta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${booking.eventTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar contrato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getPaymentStatusText(status: string): string {
  switch (status) {
    case 'PAID': return 'Pago'
    case 'PENDING': return 'Pendente'
    case 'PARTIAL': return 'Parcial'
    case 'OVERDUE': return 'Atrasado'
    default: return 'Pendente'
  }
}

// GET para buscar contratos disponíveis
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'HOLD']
        }
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    const contracts = bookings.map(booking => ({
      id: booking.id,
      eventTitle: booking.eventTitle,
      clientName: booking.client.name,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalPrice: booking.totalPrice,
      canGenerateContract: true
    }))

    return NextResponse.json({
      success: true,
      contracts,
      totalContracts: contracts.length,
      summary: `Há ${contracts.length} contratos disponíveis para geração.`
    })

  } catch (error) {
    console.error('Erro ao buscar contratos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
