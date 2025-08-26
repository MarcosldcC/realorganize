import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * limit
    
    // Construir filtros
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // Buscar atividades com relacionamentos
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },


      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })
    
    // Contar total para paginação
    const total = await prisma.activity.count({ where })
    
    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar atividades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, description, userId, metadata } = body
    
    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        metadata
      }
    })
    
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
