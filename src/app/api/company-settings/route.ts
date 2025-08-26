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
      where: { id: userId }
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
    
    // Buscar empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }
    
    // Retornar dados da empresa como configurações
    const companySettings = {
      name: company.name,
      email: company.email,
      phone: company.phone || '',
      address: company.address || '',
      cnpj: company.cnpj || ''
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
    const companyId = await getCompanyIdFromSession(request as NextRequest)
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, address, cnpj } = body

    // Validar dados obrigatórios
    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { error: 'Nome, email, telefone e endereço são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar diretamente na tabela Company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { 
        name, 
        email, 
        phone, 
        address, 
        cnpj 
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configurações da empresa atualizadas com sucesso',
      data: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        phone: updatedCompany.phone || '',
        address: updatedCompany.address || '',
        cnpj: updatedCompany.cnpj || ''
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
