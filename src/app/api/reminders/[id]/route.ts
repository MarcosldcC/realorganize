import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
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
      }
    })
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Lembrete não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Erro ao buscar lembrete:', error)
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
    const { title, description, dueDate, isRecurring, recurrence, isCompleted } = body
    
    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        recurrence,
        isCompleted: isCompleted || false
      }
    })
    
    // Criar atividade
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
    
    await prisma.activity.create({
      data: {
        type: 'REMINDER_UPDATED',
        description: `Lembrete atualizado: ${title}`,
        userId: defaultUser.id,
        reminderId: reminder.id,
        metadata: {
          dueDate: reminder.dueDate,
          isCompleted: reminder.isCompleted
        }
      }
    })
    
    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = await prisma.reminder.delete({
      where: { id: params.id }
    })
    
    // Criar atividade
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
    
    await prisma.activity.create({
      data: {
        type: 'REMINDER_DELETED',
        description: `Lembrete excluído: ${reminder.title}`,
        userId: defaultUser.id,
        metadata: {
          deletedReminder: reminder.title
        }
      }
    })
    
    return NextResponse.json({ message: 'Lembrete deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar lembrete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH para marcar como concluído
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isCompleted } = body
    
    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: { isCompleted }
    })
    
    // Criar atividade
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
    
    await prisma.activity.create({
      data: {
        type: isCompleted ? 'REMINDER_COMPLETED' : 'REMINDER_UPDATED',
        description: isCompleted ? `Lembrete concluído: ${reminder.title}` : `Lembrete reaberto: ${reminder.title}`,
        userId: defaultUser.id,
        reminderId: reminder.id,
        metadata: {
          isCompleted: reminder.isCompleted
        }
      }
    })
    
    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Erro ao atualizar status do lembrete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
