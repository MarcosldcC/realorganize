import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { InventoryService } from '@/lib/inventory'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da locação é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a locação existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Locação não encontrada' },
        { status: 404 }
      )
    }

    // Excluir a locação e todos os itens relacionados
    await prisma.$transaction(async (tx) => {
      // Excluir itens de produtos
      if (existingBooking.items.length > 0) {
        await tx.bookingItem.deleteMany({
          where: { bookingId }
        })
      }

      // Excluir itens de acessórios
      if (existingBooking.accessories.length > 0) {
        await tx.bookingAccessory.deleteMany({
          where: { bookingId }
        })
      }

      // Excluir itens de equipamentos
      if (existingBooking.equipment.length > 0) {
        await tx.bookingEquipment.deleteMany({
          where: { bookingId }
        })
      }

      // Excluir a locação
      await tx.booking.delete({
        where: { id: bookingId }
      })
    })

    // Restaurar o estoque automaticamente
    try {
      await InventoryService.restoreInventoryOnBookingDelete(bookingId)
      console.log('Estoque restaurado automaticamente após exclusão')
    } catch (inventoryError) {
      console.error('Erro ao restaurar estoque:', inventoryError)
      // Não falha a exclusão por erro no estoque
    }

    return NextResponse.json(
      { message: 'Locação excluída com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir locação:', error)
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
    const bookingId = params.id
    const body = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da locação é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a locação existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Locação não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar a locação
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        eventTitle: body.eventTitle || existingBooking.eventTitle,
        eventAddress: body.eventAddress || existingBooking.eventAddress,
        startDate: body.startDate ? new Date(body.startDate) : existingBooking.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existingBooking.endDate,
        totalValue: body.totalValue ? parseFloat(body.totalValue) : existingBooking.totalValue,
        status: body.status || existingBooking.status,
        paymentStatus: body.paymentStatus || existingBooking.paymentStatus,
        notes: body.notes || existingBooking.notes
      }
    })

    // Se houve mudança nos itens, atualizar o estoque
    if (body.products || body.accessories || body.equipment) {
      try {
        // Restaurar estoque antigo
        await InventoryService.restoreInventoryOnBookingDelete(bookingId)
        
        // Aplicar novos itens
        if (body.products) {
          await prisma.bookingItem.deleteMany({ where: { bookingId } })
          if (body.products.length > 0) {
            await prisma.bookingItem.createMany({
              data: body.products.map((p: any) => ({
                bookingId,
                productId: p.productId,
                meters: parseInt(p.meters) || 1,
                price: 0.00
              }))
            })
          }
        }

        if (body.accessories) {
          await prisma.bookingAccessory.deleteMany({ where: { bookingId } })
          if (body.accessories.length > 0) {
            await prisma.bookingAccessory.createMany({
              data: body.accessories.map((a: any) => ({
                bookingId,
                accessoryId: a.accessoryId,
                qty: parseInt(a.qty) || 1,
                price: 0.00
              }))
            })
          }
        }

        if (body.equipment) {
          await prisma.bookingEquipment.deleteMany({ where: { bookingId } })
          if (body.equipment.length > 0) {
            await prisma.bookingEquipment.createMany({
              data: body.equipment.map((e: any) => ({
                bookingId,
                equipmentId: e.equipmentId,
                qty: parseInt(e.qty) || 1,
                price: 0.00
              }))
            })
          }
        }

        // Atualizar estoque com novos itens
        await InventoryService.updateInventoryOnBookingCreate(bookingId)
        console.log('Estoque atualizado após modificação da locação')
      } catch (inventoryError) {
        console.error('Erro ao atualizar estoque:', inventoryError)
        // Não falha a modificação por erro no estoque
      }
    }

    // Buscar a locação atualizada com todos os dados
    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        accessories: {
          include: {
            accessory: true
          }
        },
        equipment: {
          include: {
            equipment: true
          }
        }
      }
    })

    return NextResponse.json(finalBooking, { status: 200 })
  } catch (error) {
    console.error('Erro ao modificar locação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID da locação é obrigatório' },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        accessories: {
          include: {
            accessory: true
          }
        },
        equipment: {
          include: {
            equipment: true
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

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Erro ao buscar locação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
