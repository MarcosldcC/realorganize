import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const completed = searchParams.get('completed')
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit
    
    // Construir filtros
    const where: any = {}
    
    if (completed !== null) {
      where.isCompleted = completed === 'true'
    }
    
    if (userId) {
      where.userId = userId
    }
    
    // Buscar lembretes com relacionamentos
    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        booking: {
          select: {
            eventTitle: true,
            startDate: true,
            endDate: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isCompleted: 'asc' },
        { dueDate: 'asc' }
      ],
      skip,
      take: limit
    })
    
    // Contar total para paginação
    const total = await prisma.reminder.count({ where })
    
    return NextResponse.json({
      reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar lembretes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, dueDate, isRecurring, recurrence, userId, bookingId, clientId } = body
    
    // Verificar se existe um usuário padrão, se não, criar um
    let defaultUser = await prisma.user.findFirst()
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@ledrental.com',
          name: 'Administrador',
          password: 'admin123',
          role: 'ADMIN'
        }
      })
    }
    
    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        recurrence,
        userId: userId || defaultUser.id,
        bookingId,
        clientId
      }
    })
    
    // Criar atividade
    await prisma.activity.create({
      data: {
        type: 'REMINDER_CREATED',
        description: `Lembrete criado: ${title}`,
        userId: defaultUser.id,
        reminderId: reminder.id,
        metadata: {
          dueDate: reminder.dueDate,
          isRecurring: reminder.isRecurring
        }
      }
    })
    
    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar lembrete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
