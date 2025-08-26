import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    console.log('Recebido bookingId:', bookingId)
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da locação é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados da locação com todas as relações necessárias
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,

        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                pricePerMeter: true
              }
            }
          }
        },
        accessories: {
          include: {
            accessory: {
              select: {
                id: true,
                name: true,
                code: true,
                pricePerUnit: true
              }
            }
          }
        }
      }
    })

    console.log('Booking encontrado:', booking ? 'SIM' : 'NÃO')
    if (booking) {
      console.log('Dados do booking:', {
        id: booking.id,
        eventTitle: booking.eventTitle,
        clientName: booking.client?.name,
        itemsCount: booking.items?.length,
        accessoriesCount: booking.accessories?.length,
        totalPrice: (booking as any).totalValue
      })
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Locação não encontrada' },
        { status: 404 }
      )
    }

    // Validar dados obrigatórios
    const validationErrors = []
    if (!booking.client?.name?.trim()) validationErrors.push('Nome do cliente')
    if (!booking.client?.email?.trim()) validationErrors.push('Email do cliente')
    if (!booking.eventTitle?.trim()) validationErrors.push('Título do evento')

    if (!booking.startDate) validationErrors.push('Data de início')
    if (!booking.endDate) validationErrors.push('Data de fim')
    if (booking.items.length === 0 && booking.accessories.length === 0) {
      validationErrors.push('Pelo menos um produto ou acessório')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: `Dados obrigatórios não preenchidos: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }

    // Buscar configurações da empresa
    let companySettings = await prisma.companySetting.findFirst()
    console.log('Company settings encontradas:', companySettings ? 'SIM' : 'NÃO')
    
    if (!companySettings) {
      // Criar configurações padrão se não existirem
              companySettings = await (prisma as any).companySetting.create({
          data: {
            name: 'Empresa de Locação',
            email: 'contato@empresa.com',
            phone: '(11) 0000-0000',
            address: 'Endereço da Empresa'
          }
        })
      console.log('Configurações padrão criadas')
    }

    // Gerar HTML do contrato
    const contractHTML = generateContractHTML(booking, companySettings)
    console.log('HTML gerado com sucesso, tamanho:', contractHTML.length)
    
    if (contractHTML.length < 1000) {
      console.error('HTML gerado parece estar muito pequeno, possivelmente vazio')
      return NextResponse.json(
        { error: 'Erro ao gerar conteúdo do contrato' },
        { status: 500 }
      )
    }

    // Gerar PDF usando Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Definir viewport e conteúdo
    await page.setViewport({ width: 1200, height: 1600 })
    await page.setContent(contractHTML, { waitUntil: 'networkidle0' })
    
    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    })
    
    await browser.close()
    
    console.log('PDF gerado com sucesso, tamanho:', pdfBuffer.length)
    
    if (pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao gerar PDF' },
        { status: 500 }
      )
    }
    
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${booking.eventTitle.replace(/[^a-z0-9]/gi, '_')}-${new Date(booking.startDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf"`
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

function generateContractHTML(booking: any, companySettings: any) {
  console.log('Iniciando geração do HTML do contrato')
  
  // Dados do evento com validação
  const eventTitle = booking.eventTitle?.trim() || 'Evento sem título'
  const clientName = booking.client?.name?.trim() || 'Cliente não especificado'
  const clientEmail = booking.client?.email?.trim() || 'Email não especificado'
  const clientPhone = booking.client?.phone?.trim() || ''
  const clientCompany = booking.client?.company?.trim() || ''
  const clientDocument = booking.client?.document?.trim() || ''
  const clientAddress = booking.client?.address?.trim() || ''
  const eventAddress = booking.eventAddress?.trim() || 'Endereço não especificado'

  // Dados da empresa com validação
  const companyName = companySettings.name?.trim() || 'Empresa de Locação'
  const companyDocument = companySettings.cnpj?.trim() || 'CNPJ não informado'
  const companyAddress = companySettings.address?.trim() || 'Endereço não informado'
  const companyPhone = companySettings.phone?.trim() || 'Telefone não informado'
  const companyEmail = companySettings.email?.trim() || 'Email não informado'
  const companyLogoUrl = companySettings.logoUrl?.trim() || ''

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value) return 'R$ 0,00'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data não informada'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error)
      return 'Data inválida'
    }
  }

  const calculateSubtotal = () => {
    let subtotal = 0
    
    // Calcular produtos
    if (booking.items && Array.isArray(booking.items)) {
      booking.items.forEach((item: any) => {
        if (item && item.product && item.product.pricePerMeter && item.meters) {
          const price = parseFloat(item.product.pricePerMeter.toString())
          const meters = parseFloat(item.meters.toString())
          if (!isNaN(price) && !isNaN(meters)) {
            subtotal += meters * price
          }
        }
      })
    }
    
    // Calcular acessórios
    if (booking.accessories && Array.isArray(booking.accessories)) {
      booking.accessories.forEach((item: any) => {
        if (item && item.accessory && item.accessory.pricePerUnit && item.qty) {
          const price = parseFloat(item.accessory.pricePerUnit.toString())
          const qty = parseFloat(item.qty.toString())
          if (!isNaN(price) && !isNaN(qty)) {
            subtotal += qty * price
          }
        }
      })
    }
    
    return subtotal
  }

  const calculateTotalPrice = () => {
    return booking.totalPrice || calculateSubtotal()
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'PAGO'
      case 'PENDING': return 'PENDENTE'
      case 'PARTIAL': return 'PARCIAL'
      case 'OVERDUE': return 'ATRASADO'
      default: return 'PENDENTE'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'color: green;'
      case 'PENDING': return 'color: orange;'
      case 'PARTIAL': return 'color: blue;'
      case 'OVERDUE': return 'color: red;'
      default: return 'color: orange;'
    }
  }

  const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Locação - ${eventTitle}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: white;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .logo {
            max-height: 60px;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .contract-number {
            font-size: 12px;
            color: #666;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
        }
        
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 16px;
        }
        
        .info-box {
            display: table-cell;
            width: 50%;
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 4px;
            vertical-align: top;
        }
        
        .info-box:first-child {
            margin-right: 10px;
        }
        
        .info-box h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: bold;
        }
        
        .info-box p {
            margin: 4px 0;
            font-size: 11px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 10px;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }
        
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 10px;
        }
        
        .financial-summary {
            background-color: #f9f9f9;
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
        }
        
        .total-line {
            border-top: 1px solid #ccc;
            padding-top: 8px;
            margin-top: 8px;
            font-weight: bold;
        }
        
        .signatures {
            display: table;
            width: 100%;
            margin-top: 30px;
        }
        
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 16px;
        }
        
        .no-items {
            text-align: center;
            padding: 16px;
            color: #666;
            font-style: italic;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Logo" class="logo">` : ''}
        <div class="title">${companyName}</div>
        <div>${companyAddress}</div>
        <div>CNPJ: ${companyDocument} | Tel: ${companyPhone}</div>
    </div>

    <div class="section">
        <div class="title">CONTRATO DE LOCAÇÃO</div>
        <div class="contract-number">Contrato Nº ${booking.id ? booking.id.slice(-8).toUpperCase() : 'N/A'}</div>
    </div>

    <div class="section">
        <div class="info-grid">
            <div class="info-box">
                <h4>LOCADOR</h4>
                <p><strong>${companyName}</strong></p>
                <p>CNPJ: ${companyDocument}</p>
                <p>${companyAddress}</p>
                <p>Tel: ${companyPhone}</p>
                <p>Email: ${companyEmail}</p>
            </div>
            <div class="info-box">
                <h4>LOCATÁRIO</h4>
                <p><strong>${clientName}</strong></p>
                ${clientCompany ? `<p>Empresa: ${clientCompany}</p>` : ''}
                ${clientDocument ? `<p>Documento: ${clientDocument}</p>` : ''}
                ${clientAddress ? `<p>${clientAddress}</p>` : ''}
                ${clientPhone ? `<p>Tel: ${clientPhone}</p>` : ''}
                <p>Email: ${clientEmail}</p>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">DETALHES DO EVENTO</div>
        <div class="info-grid">
            <div class="info-box">
                <p><strong>Evento:</strong> ${eventTitle}</p>
                <p><strong>Endereço:</strong> ${eventAddress}</p>
            </div>
            <div class="info-box">
                <p><strong>Data de Início:</strong> ${formatDate(booking.startDate)}</p>
                <p><strong>Data de Fim:</strong> ${formatDate(booking.endDate)}</p>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">PRODUTOS E ACESSÓRIOS ALUGADOS</div>
        
        ${booking.items && booking.items.length > 0 ? `
        <h4>PRODUTOS</h4>
        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Metros</th>
                    <th>Preço/m²</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${booking.items.map((item: any) => {
                  const productName = item.product?.name || 'Produto não especificado'
                  const productCode = item.product?.code || 'N/A'
                  const meters = item.meters || 0
                  const pricePerMeter = item.product?.pricePerMeter || 0
                  const total = meters * parseFloat(pricePerMeter.toString())
                  return `
                  <tr>
                      <td>${productName}</td>
                      <td>${productCode}</td>
                      <td>${meters} m²</td>
                      <td>${formatCurrency(pricePerMeter)}</td>
                      <td>${formatCurrency(total)}</td>
                  </tr>
                  `
                }).join('')}
            </tbody>
        </table>
        ` : ''}

        ${booking.accessories && booking.accessories.length > 0 ? `
        <h4>ACESSÓRIOS</h4>
        <table>
            <thead>
                <tr>
                    <th>Acessório</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>Preço/Unidade</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${booking.accessories.map((item: any) => {
                  const accessoryName = item.accessory?.name || 'Acessório não especificado'
                  const accessoryCode = item.accessory?.code || 'N/A'
                  const qty = item.qty || 0
                  const pricePerUnit = item.accessory?.pricePerUnit || 0
                  const total = qty * parseFloat(pricePerUnit.toString())
                  return `
                  <tr>
                      <td>${accessoryName}</td>
                      <td>${accessoryCode}</td>
                      <td>${qty} un</td>
                      <td>${formatCurrency(pricePerUnit)}</td>
                      <td>${formatCurrency(total)}</td>
                  </tr>
                  `
                }).join('')}
            </tbody>
        </table>
        ` : ''}

        ${(!booking.items || booking.items.length === 0) && (!booking.accessories || booking.accessories.length === 0) ? 
          '<div class="no-items">Nenhum produto ou acessório especificado para esta locação.</div>' : 
          ''
        }
    </div>

    <div class="section">
        <div class="section-title">RESUMO FINANCEIRO</div>
        <div class="financial-summary">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(calculateSubtotal())}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Status do Pagamento:</span>
                <span style="font-weight: bold; ${getPaymentStatusColor(booking.paymentStatus)}">
                    ${getPaymentStatusText(booking.paymentStatus)}
                </span>
            </div>
            <div class="total-line" style="display: flex; justify-content: space-between;">
                <span>Valor Total:</span>
                <span>${formatCurrency(calculateTotalPrice())}</span>
            </div>
        </div>
    </div>

    ${booking.notes ? `
    <div class="section">
        <div class="section-title">OBSERVAÇÕES</div>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 4px;">
            <p>${booking.notes}</p>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">TERMOS E CONDIÇÕES</div>
        <div style="font-size: 11px;">
            <p><strong>1.</strong> O locatário se compromete a devolver todos os produtos e acessórios no mesmo estado em que foram recebidos.</p>
            <p><strong>2.</strong> Danos causados durante o período de locação serão de responsabilidade do locatário.</p>
            <p><strong>3.</strong> O não cumprimento dos prazos de pagamento acarretará em multa de 2% ao mês sobre o valor em atraso.</p>
            <p><strong>4.</strong> Este contrato foi celebrado em ${formatDate(new Date().toISOString())} e permanecerá válido até a conclusão da locação.</p>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <p style="font-weight: bold;">${companyName}</p>
            <p style="font-size: 10px;">Assinatura do Locador</p>
        </div>
        <div class="signature-box">
            <p style="font-weight: bold;">${clientName}</p>
            <p style="font-size: 10px;">Assinatura do Locatário</p>
        </div>
    </div>
</body>
</html>`

  console.log('HTML final gerado com sucesso, tamanho:', htmlTemplate.length)
  return htmlTemplate
}
