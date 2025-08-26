import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const companySettings = await prisma.companySetting.findFirst()
    
    if (!companySettings) {
      // Criar configurações padrão se não existirem
      const defaultSettings = await prisma.companySetting.create({
        data: {
          name: 'RealPromo',
          email: 'contato@realpromo.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Flores, 123 - São Paulo, SP',
          cnpj: '00.000.000/0000-00'
        }
      })
      return NextResponse.json(defaultSettings)
    }
    
    return NextResponse.json(companySettings)
  } catch (error) {
    console.error('Erro ao buscar configurações da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address, cnpj } = body

    // Validar dados obrigatórios
    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { error: 'Nome, email, telefone e endereço são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar configurações existentes ou criar novas
    let companySettings = await prisma.companySetting.findFirst()
    
    if (companySettings) {
      // Atualizar configurações existentes
      companySettings = await prisma.companySetting.update({
        where: { id: companySettings.id },
        data: { name, email, phone, address, cnpj }
      })
    } else {
      // Criar novas configurações
      companySettings = await prisma.companySetting.create({
        data: { name, email, phone, address, cnpj }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações da empresa atualizadas com sucesso',
      data: companySettings
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
