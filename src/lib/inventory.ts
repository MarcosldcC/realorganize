import { prisma } from './db'

export interface InventoryItem {
  id: string
  name: string
  type: 'PRODUTO' | 'ACESSÓRIO' | 'EQUIPAMENTO'
  totalQuantity: number
  occupiedQuantity: number
  availableQuantity: number
}

export interface BookingConflict {
  id: string
  type: string
  name: string
  requested: number
  available: number
  total: number
  unit: string
  conflictingBookings: Array<{
    id: string
    eventTitle: string
    startDate: string
    endDate: string
    quantity: number
  }>
}

export class InventoryService {
  /**
   * Atualiza o estoque quando uma locação é criada
   */
  static async updateInventoryOnBookingCreate(bookingId: string) {
    try {
      // Buscar a locação com todos os itens
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          items: true,
          accessories: true,
          equipment: true
        }
      })

      if (!booking) {
        throw new Error('Locação não encontrada')
      }

      // Verificar se o status da locação deve ocupar estoque
      const activeStatuses = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
      if (!activeStatuses.includes(booking.status)) {
        console.log(`⚠️  Locação ${bookingId} com status ${booking.status} não ocupa estoque`)
        return
      }

      console.log(`Atualizando estoque para locação ${bookingId} (status: ${booking.status}):`, {
        produtos: booking.items.length,
        acessorios: booking.accessories.length,
        equipamentos: booking.equipment.length
      })

      // Atualizar estoque de produtos (metros)
      for (const item of booking.items) {
        if (item.meters > 0) {
          await (prisma as any).product.update({
            where: { id: item.productId },
            data: {
              occupiedMeters: {
                increment: item.meters
              }
            }
          })
          console.log(`  📦 Produto ${item.productId}: +${item.meters}m² ocupados`)
        }
      }

      // Atualizar estoque de acessórios (unidades)
      for (const accessory of booking.accessories) {
        if (accessory.qty > 0) {
          await (prisma as any).accessory.update({
            where: { id: accessory.accessoryId },
            data: {
              occupiedQty: {
                increment: accessory.qty
              }
            }
          })
          console.log(`  ⚙️ Acessório ${accessory.accessoryId}: +${accessory.qty} unidades ocupadas`)
        }
      }

      // Atualizar estoque de equipamentos (unidades)
      for (const equipment of booking.equipment) {
        if (equipment.qty > 0) {
          await (prisma as any).equipment.update({
            where: { id: equipment.equipmentId },
            data: {
              occupiedQty: {
                increment: equipment.qty
              }
            }
          })
          console.log(`  🔧 Equipamento ${equipment.equipmentId}: +${equipment.qty} unidades ocupadas`)
        }
      }

      console.log(`✅ Estoque atualizado com sucesso para locação ${bookingId}`)
    } catch (error) {
      console.error('❌ Erro ao atualizar estoque:', error)
      throw error
    }
  }

  /**
   * Restaura o estoque quando uma locação é excluída
   */
  static async restoreInventoryOnBookingDelete(bookingId: string) {
    try {
      // Buscar a locação com todos os itens
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          items: true,
          accessories: true,
          equipment: true
        }
      })

      if (!booking) {
        throw new Error('Locação não encontrada')
      }

      // Verificar se o status da locação ocupava estoque
      const activeStatuses = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
      if (!activeStatuses.includes(booking.status)) {
        console.log(`⚠️  Locação ${bookingId} com status ${booking.status} não ocupava estoque`)
        return
      }

      console.log(`Restaurando estoque para locação ${bookingId} (status: ${booking.status}):`)

      // Restaurar estoque de produtos
      for (const item of booking.items) {
        if (item.meters > 0) {
          await (prisma as any).product.update({
            where: { id: item.productId },
            data: {
              occupiedMeters: {
                decrement: item.meters
              }
            }
          })
          console.log(`  📦 Produto ${item.productId}: -${item.meters}m² restaurados`)
        }
      }

      // Restaurar estoque de acessórios
      for (const accessory of booking.accessories) {
        if (accessory.qty > 0) {
          await (prisma as any).accessory.update({
            where: { id: accessory.accessoryId },
            data: {
              occupiedQty: {
                decrement: accessory.qty
              }
            }
          })
          console.log(`  ⚙️ Acessório ${accessory.accessoryId}: -${accessory.qty} unidades restauradas`)
        }
      }

      // Restaurar estoque de equipamentos
      for (const equipment of booking.equipment) {
        if (equipment.qty > 0) {
          await (prisma as any).equipment.update({
            where: { id: equipment.equipmentId },
            data: {
              occupiedQty: {
                decrement: equipment.qty
              }
            }
          })
          console.log(`  🔧 Equipamento ${equipment.equipmentId}: -${equipment.qty} unidades restauradas`)
        }
      }

      console.log(`✅ Estoque restaurado com sucesso para locação ${bookingId}`)
    } catch (error) {
      console.error('❌ Erro ao restaurar estoque:', error)
      throw error
    }
  }

  /**
   * Atualiza o estoque quando uma locação é modificada
   */
  static async updateInventoryOnBookingModify(
    bookingId: string,
    oldItems: any[],
    newItems: any[]
  ) {
    try {
      // Primeiro, restaurar o estoque antigo
      await this.restoreInventoryOnBookingDelete(bookingId)
      
      // Depois, aplicar o novo estoque
      await this.updateInventoryOnBookingCreate(bookingId)
      
      console.log(`Estoque atualizado para modificação da locação ${bookingId}`)
    } catch (error) {
      console.error('Erro ao atualizar estoque na modificação:', error)
      throw error
    }
  }

  /**
   * Verifica e atualiza estoque de locações expiradas
   */
  static async checkExpiredBookings() {
    try {
      const now = new Date()
      
      // Buscar locações expiradas (endDate < now) com status ativo
      const expiredBookings = await prisma.booking.findMany({
        where: {
          endDate: {
            lt: now
          },
          status: {
            in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
          }
        },
        include: {
          items: true,
          accessories: true,
          equipment: true
        }
      })

      console.log(`Encontradas ${expiredBookings.length} locações expiradas`)

      for (const booking of expiredBookings) {
        // Marcar como COMPLETED
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' }
        })

        // Restaurar estoque
        await this.restoreInventoryOnBookingDelete(booking.id)
        
        console.log(`Locação ${booking.id} marcada como expirada e estoque restaurado`)
      }

      return expiredBookings.length
    } catch (error) {
      console.error('Erro ao verificar locações expiradas:', error)
      throw error
    }
  }

  /**
   * Corrige estoque de locações com status incorreto
   */
  static async fixInventoryStatus() {
    try {
      console.log('🔧 Corrigindo status do estoque...')
      
      // Buscar todas as locações
      const allBookings = await prisma.booking.findMany({
        include: {
          items: true,
          accessories: true,
          equipment: true
        }
      })

      let fixedCount = 0
      const activeStatuses = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']

      for (const booking of allBookings) {
        const shouldOccupyStock = activeStatuses.includes(booking.status)
        let needsFix = false

        // Verificar produtos
        for (const item of booking.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          })
          
                     if (product) {
             const currentOccupied = (product as any).occupiedMeters || 0
             const expectedOccupied = shouldOccupyStock ? item.meters : 0
             
             if (currentOccupied !== expectedOccupied) {
               needsFix = true
               console.log(`  📦 Produto ${product.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
             }
           }
        }

        // Verificar acessórios
        for (const accessory of booking.accessories) {
          const acc = await prisma.accessory.findUnique({
            where: { id: accessory.accessoryId }
          })
          
          if (acc) {
            const currentOccupied = acc.occupiedQty || 0
            const expectedOccupied = shouldOccupyStock ? accessory.qty : 0
            
            if (currentOccupied !== expectedOccupied) {
              needsFix = true
              console.log(`  ⚙️ Acessório ${acc.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
            }
          }
        }

        // Verificar equipamentos
        for (const equip of booking.equipment) {
          const eq = await prisma.equipment.findUnique({
            where: { id: equip.equipmentId }
          })
          
          if (eq) {
            const currentOccupied = eq.occupiedQty || 0
            const expectedOccupied = shouldOccupyStock ? equip.qty : 0
            
            if (currentOccupied !== expectedOccupied) {
              needsFix = true
              console.log(`  🔧 Equipamento ${eq.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
            }
          }
        }

        if (needsFix) {
          console.log(`  🔄 Corrigindo locação ${booking.id} (${booking.eventTitle})`)
          
          // Restaurar estoque atual
          await this.restoreInventoryOnBookingDelete(booking.id)
          
          // Aplicar estoque correto se necessário
          if (shouldOccupyStock) {
            await this.updateInventoryOnBookingCreate(booking.id)
          }
          
          fixedCount++
        }
      }

      console.log(`✅ Correção concluída: ${fixedCount} locações corrigidas`)
      return fixedCount
    } catch (error) {
      console.error('❌ Erro ao corrigir estoque:', error)
      throw error
    }
  }

  /**
   * Valida disponibilidade de estoque para um período específico
   */
  static async validateAvailabilityForPeriod(
    startDate: Date,
    endDate: Date,
    products: Array<{ productId: string; meters: number }>,
    accessories: Array<{ accessoryId: string; qty: number }>,
    equipment: Array<{ equipmentId: string; qty: number }>,
    excludeBookingId?: string // Para edição de locações existentes
  ): Promise<{
    available: boolean
    conflicts: BookingConflict[]
    periodAvailability: {
      startDate: string
      endDate: string
      totalBookings: number
      totalConflicts: number
    }
  }> {
    try {
      console.log('🔍 Validando disponibilidade para período:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        produtos: products.length,
        acessorios: accessories.length,
        equipamentos: equipment.length
      })

      const conflicts: BookingConflict[] = []
      let totalBookings = 0
      let totalConflicts = 0

      // 1. Validar produtos (metros)
      for (const product of products) {
        if (product.meters > 0) {
          const productInfo = await prisma.product.findUnique({
            where: { id: product.productId }
          })

          if (productInfo) {
            const conflict = await this.checkProductAvailability(
              productInfo,
              product.meters,
              startDate,
              endDate,
              excludeBookingId
            )

            if (conflict) {
              conflicts.push(conflict)
              totalConflicts++
            }
          }
        }
      }

      // 2. Validar acessórios (unidades)
      for (const accessory of accessories) {
        if (accessory.qty > 0) {
          const accessoryInfo = await prisma.accessory.findUnique({
            where: { id: accessory.accessoryId }
          })

          if (accessoryInfo) {
            const conflict = await this.checkAccessoryAvailability(
              accessoryInfo,
              accessory.qty,
              startDate,
              endDate,
              excludeBookingId
            )

            if (conflict) {
              conflicts.push(conflict)
              totalConflicts++
            }
          }
        }
      }

      // 3. Validar equipamentos (unidades)
      for (const equip of equipment) {
        if (equip.qty > 0) {
          const equipmentInfo = await prisma.equipment.findUnique({
            where: { id: equip.equipmentId }
          })

          if (equipmentInfo) {
            const conflict = await this.checkEquipmentAvailability(
              equipmentInfo,
              equip.qty,
              startDate,
              endDate,
              excludeBookingId
            )

            if (conflict) {
              conflicts.push(conflict)
              totalConflicts++
            }
          }
        }
      }

      // 4. Contar total de locações no período
      totalBookings = await this.countBookingsInPeriod(startDate, endDate, excludeBookingId)

      const result = {
        available: conflicts.length === 0,
        conflicts,
        periodAvailability: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalBookings,
          totalConflicts: conflicts.length
        }
      }

      console.log(`✅ Validação concluída: ${conflicts.length === 0 ? 'Estoque suficiente' : `${conflicts.length} conflitos encontrados`}`)
      return result
    } catch (error) {
      console.error('❌ Erro ao validar disponibilidade para período:', error)
      throw error
    }
  }

  /**
   * Verifica disponibilidade de um produto específico para um período
   */
  private static async checkProductAvailability(
    product: any,
    requestedMeters: number,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<BookingConflict | null> {
    // Buscar todas as locações ativas que sobrepõem o período
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          },
          {
            status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] }
          },
          excludeBookingId ? { id: { not: excludeBookingId } } : {}
        ]
      },
      include: {
        items: {
          where: { productId: product.id }
        }
      }
    })

    // Calcular metros ocupados no período
    let occupiedMeters = 0
    const conflictingBookings: any[] = []

    for (const booking of overlappingBookings) {
      for (const item of booking.items) {
        occupiedMeters += item.meters
        conflictingBookings.push({
          id: booking.id,
          eventTitle: booking.eventTitle,
          startDate: booking.startDate,
          endDate: booking.endDate,
          quantity: item.meters
        })
      }
    }

    const availableMeters = product.totalMeters - occupiedMeters

    if (availableMeters < requestedMeters) {
      return {
        id: product.id,
        type: 'PRODUTO',
        name: product.name,
        requested: requestedMeters,
        available: availableMeters,
        total: product.totalMeters,
        unit: 'm²',
        conflictingBookings
      }
    }

    return null
  }

  /**
   * Verifica disponibilidade de um acessório específico para um período
   */
  private static async checkAccessoryAvailability(
    accessory: any,
    requestedQty: number,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<BookingConflict | null> {
    // Buscar todas as locações ativas que sobrepõem o período
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          },
          {
            status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] }
          },
          excludeBookingId ? { id: { not: excludeBookingId } } : {}
        ]
      },
      include: {
        accessories: {
          where: { accessoryId: accessory.id }
        }
      }
    })

    // Calcular unidades ocupadas no período
    let occupiedQty = 0
    const conflictingBookings: any[] = []

    for (const booking of overlappingBookings) {
      for (const acc of booking.accessories) {
        occupiedQty += acc.qty
        conflictingBookings.push({
          id: booking.id,
          eventTitle: booking.eventTitle,
          startDate: booking.startDate,
          endDate: booking.endDate,
          quantity: acc.qty
        })
      }
    }

    const availableQty = accessory.totalQty - occupiedQty

    if (availableQty < requestedQty) {
      return {
        id: accessory.id,
        type: 'ACESSÓRIO',
        name: accessory.name,
        requested: requestedQty,
        available: availableQty,
        total: accessory.totalQty,
        unit: 'un',
        conflictingBookings
      }
    }

    return null
  }

  /**
   * Verifica disponibilidade de um equipamento específico para um período
   */
  private static async checkEquipmentAvailability(
    equipment: any,
    requestedQty: number,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<BookingConflict | null> {
    // Buscar todas as locações ativas que sobrepõem o período
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          },
          {
            status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] }
          },
          excludeBookingId ? { id: { not: excludeBookingId } } : {}
        ]
      },
      include: {
        equipment: {
          where: { equipmentId: equipment.id }
        }
      }
    })

    // Calcular unidades ocupadas no período
    let occupiedQty = 0
    const conflictingBookings: any[] = []

    for (const booking of overlappingBookings) {
      for (const equip of booking.equipment) {
        occupiedQty += equip.qty
        conflictingBookings.push({
          id: booking.id,
          eventTitle: booking.eventTitle,
          startDate: booking.startDate,
          endDate: booking.endDate,
          quantity: equip.qty
        })
      }
    }

    const availableQty = equipment.totalQty - occupiedQty

    if (availableQty < requestedQty) {
      return {
        id: equipment.id,
        type: 'EQUIPAMENTO',
        name: equipment.name,
        requested: requestedQty,
        available: availableQty,
        total: equipment.totalQty,
        unit: 'un',
        conflictingBookings
      }
    }

    return null
  }

  /**
   * Conta o total de locações ativas em um período
   */
  private static async countBookingsInPeriod(
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<number> {
    const count = await prisma.booking.count({
      where: {
        AND: [
          {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          },
          {
            status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] }
          },
          excludeBookingId ? { id: { not: excludeBookingId } } : {}
        ]
      }
    })

    return count
  }

  /**
   * Obtém o status atual do estoque
   */
  static async getInventoryStatus(): Promise<{
    products: (InventoryItem & { name: string })[]
    accessories: (InventoryItem & { name: string })[]
    equipment: (InventoryItem & { name: string })[]
  }> {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          totalMeters: true,
          occupiedMeters: true
        }
      })

      const accessories = await prisma.accessory.findMany({
        select: {
          id: true,
          name: true,
          totalQty: true,
          occupiedQty: true
        }
      })

      const equipment = await prisma.equipment.findMany({
        select: {
          id: true,
          name: true,
          totalQty: true,
          occupiedQty: true
        }
      })

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          type: 'PRODUTO' as const,
          totalQuantity: p.totalMeters,
          occupiedQuantity: p.occupiedMeters,
          availableQuantity: p.totalMeters - p.occupiedMeters
        })),
        accessories: accessories.map(a => ({
          id: a.id,
          name: a.name,
          type: 'ACESSÓRIO' as const,
          totalQuantity: a.totalQty,
          occupiedQuantity: a.occupiedQty,
          availableQuantity: a.totalQty - a.occupiedQty
        })),
        equipment: equipment.map(e => ({
          id: e.id,
          name: e.name,
          type: 'EQUIPAMENTO' as const,
          totalQuantity: e.totalQty,
          occupiedQuantity: e.occupiedQty,
          availableQuantity: e.totalQty - e.occupiedQty
        }))
      }
    } catch (error) {
      console.error('Erro ao obter status do estoque:', error)
      throw error
    }
  }

  /**
   * Valida se há estoque suficiente para uma locação
   */
  static async validateInventoryAvailability(
    products: Array<{ productId: string; meters: number }>,
    accessories: Array<{ accessoryId: string; qty: number }>,
    equipment: Array<{ equipmentId: string; qty: number }>
  ): Promise<{
    available: boolean
    conflicts: Array<{
      id: string
      type: string
      name: string
      requested: number
      available: number
      total: number
      unit: string
    }>
  }> {
    try {
      const conflicts: any[] = []
      console.log('🔍 Validando disponibilidade de estoque...')

      // Validar produtos (metros)
      for (const product of products) {
        if (product.meters > 0) {
          const productInfo = await prisma.product.findUnique({
            where: { id: product.productId }
          })

          if (productInfo) {
            const available = productInfo.totalMeters - productInfo.occupiedMeters
            console.log(`  📦 ${productInfo.name}: ${available}/${productInfo.totalMeters}m² disponíveis, solicitados: ${product.meters}m²`)
            
            if (available < product.meters) {
              conflicts.push({
                id: product.productId,
                type: 'PRODUTO',
                name: productInfo.name,
                requested: product.meters,
                available,
                total: productInfo.totalMeters,
                unit: 'm²'
              })
              console.log(`    ❌ Conflito: ${product.meters - available}m² insuficientes`)
            }
          }
        }
      }

      // Validar acessórios (unidades)
      for (const accessory of accessories) {
        if (accessory.qty > 0) {
          const accessoryInfo = await prisma.accessory.findUnique({
            where: { id: accessory.accessoryId }
          })

          if (accessoryInfo) {
            const available = accessoryInfo.totalQty - accessoryInfo.occupiedQty
            console.log(`  ⚙️ ${accessoryInfo.name}: ${available}/${accessoryInfo.totalQty} unidades disponíveis, solicitadas: ${accessory.qty}`)
            
            if (available < accessory.qty) {
              conflicts.push({
                id: accessory.accessoryId,
                type: 'ACESSÓRIO',
                name: accessoryInfo.name,
                requested: accessory.qty,
                available,
                total: accessoryInfo.totalQty,
                unit: 'un'
              })
              console.log(`    ❌ Conflito: ${accessory.qty - available} unidades insuficientes`)
            }
          }
        }
      }

      // Validar equipamentos (unidades)
      for (const equip of equipment) {
        if (equip.qty > 0) {
          const equipmentInfo = await prisma.equipment.findUnique({
            where: { id: equip.equipmentId }
          })

          if (equipmentInfo) {
            const available = equipmentInfo.totalQty - equipmentInfo.occupiedQty
            console.log(`  🔧 ${equipmentInfo.name}: ${available}/${equipmentInfo.totalQty} unidades disponíveis, solicitadas: ${equip.qty}`)
            
            if (available < equip.qty) {
              conflicts.push({
                id: equip.equipmentId,
                type: 'EQUIPAMENTO',
                name: equipmentInfo.name,
                requested: equip.qty,
                available,
                total: equipmentInfo.totalQty,
                unit: 'un'
              })
              console.log(`    ❌ Conflito: ${equip.qty - available} unidades insuficientes`)
            }
          }
        }
      }

      const result = {
        available: conflicts.length === 0,
        conflicts
      }

      console.log(`✅ Validação concluída: ${conflicts.length === 0 ? 'Estoque suficiente' : `${conflicts.length} conflitos encontrados`}`)
      return result
    } catch (error) {
      console.error('❌ Erro ao validar disponibilidade do estoque:', error)
      throw error
    }
  }

  /**
   * Obtém o status detalhado do estoque para um período específico
   */
  static async getDetailedInventoryStatus(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    period: { startDate?: string; endDate?: string }
    products: Array<{
      id: string
      name: string
      totalMeters: number
      occupiedMeters: number
      availableMeters: number
      utilization: number
      activeBookings: number
    }>
    accessories: Array<{
      id: string
      name: string
      totalQty: number
      occupiedQty: number
      availableQty: number
      utilization: number
      activeBookings: number
    }>
    equipment: Array<{
      id: string
      name: string
      totalQty: number
      occupiedQty: number
      availableQty: number
      utilization: number
      activeBookings: number
    }>
    summary: {
      totalItems: number
      totalOccupied: number
      totalAvailable: number
      overallUtilization: number
    }
  }> {
    try {
      const products = await prisma.product.findMany()
      const accessories = await prisma.accessory.findMany()
      const equipment = await prisma.equipment.findMany()

      const productStatus = await Promise.all(
        products.map(async (p) => {
          const activeBookings = startDate && endDate 
            ? await this.countProductBookingsInPeriod(p.id, startDate, endDate)
            : await this.countActiveProductBookings(p.id)

          return {
            id: p.id,
            name: p.name,
            totalMeters: p.totalMeters,
            occupiedMeters: p.occupiedMeters || 0,
            availableMeters: p.totalMeters - (p.occupiedMeters || 0),
            utilization: p.totalMeters > 0 ? ((p.occupiedMeters || 0) / p.totalMeters * 100) : 0,
            activeBookings
          }
        })
      )

      const accessoryStatus = await Promise.all(
        accessories.map(async (a) => {
          const activeBookings = startDate && endDate 
            ? await this.countAccessoryBookingsInPeriod(a.id, startDate, endDate)
            : await this.countActiveAccessoryBookings(a.id)

          return {
            id: a.id,
            name: a.name,
            totalQty: a.totalQty,
            occupiedQty: a.occupiedQty || 0,
            availableQty: a.totalQty - (a.occupiedQty || 0),
            utilization: a.totalQty > 0 ? ((a.occupiedQty || 0) / a.totalQty * 100) : 0,
            activeBookings
          }
        })
      )

      const equipmentStatus = await Promise.all(
        equipment.map(async (e) => {
          const activeBookings = startDate && endDate 
            ? await this.countEquipmentBookingsInPeriod(e.id, startDate, endDate)
            : await this.countActiveEquipmentBookings(e.id)

          return {
            id: e.id,
            name: e.name,
            totalQty: e.totalQty,
            occupiedQty: e.occupiedQty || 0,
            availableQty: e.totalQty - (e.occupiedQty || 0),
            utilization: e.totalQty > 0 ? ((e.occupiedQty || 0) / e.totalQty * 100) : 0,
            activeBookings
          }
        })
      )

      // Calcular resumo geral
      const totalItems = products.length + accessories.length + equipment.length
      const totalOccupied = productStatus.reduce((sum, p) => sum + p.occupiedMeters, 0) +
                           accessoryStatus.reduce((sum, a) => sum + a.occupiedQty, 0) +
                           equipmentStatus.reduce((sum, e) => sum + e.occupiedQty, 0)
      const totalAvailable = productStatus.reduce((sum, p) => sum + p.availableMeters, 0) +
                            accessoryStatus.reduce((sum, a) => sum + a.availableQty, 0) +
                            equipmentStatus.reduce((sum, e) => sum + e.availableQty, 0)
      const totalCapacity = productStatus.reduce((sum, p) => sum + p.totalMeters, 0) +
                           accessoryStatus.reduce((sum, a) => sum + a.totalQty, 0) +
                           equipmentStatus.reduce((sum, e) => sum + e.totalQty, 0)
      const overallUtilization = totalCapacity > 0 ? (totalOccupied / totalCapacity * 100) : 0

      return {
        period: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        },
        products: productStatus,
        accessories: accessoryStatus,
        equipment: equipmentStatus,
        summary: {
          totalItems,
          totalOccupied,
          totalAvailable,
          overallUtilization: Math.round(overallUtilization * 100) / 100
        }
      }
    } catch (error) {
      console.error('❌ Erro ao obter status detalhado do estoque:', error)
      throw error
    }
  }

  // Funções auxiliares para contar locações
  private static async countProductBookingsInPeriod(productId: string, startDate: Date, endDate: Date): Promise<number> {
    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              { startDate: { lte: endDate }, endDate: { gte: startDate } }
            ]
          },
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { items: { some: { productId } } }
        ]
      }
    })
    return bookings.length
  }

  private static async countAccessoryBookingsInPeriod(accessoryId: string, startDate: Date, endDate: Date): Promise<number> {
    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              { startDate: { lte: endDate }, endDate: { gte: startDate } }
            ]
          },
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { accessories: { some: { accessoryId } } }
        ]
      }
    })
    return bookings.length
  }

  private static async countEquipmentBookingsInPeriod(equipmentId: string, startDate: Date, endDate: Date): Promise<number> {
    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              { startDate: { lte: endDate }, endDate: { gte: startDate } }
            ]
          },
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { equipment: { some: { equipmentId } } }
        ]
      }
    })
    return bookings.length
  }

  private static async countActiveProductBookings(productId: string): Promise<number> {
    const bookings = await prisma.booking.count({
      where: {
        AND: [
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { items: { some: { productId } } }
        ]
      }
    })
    return bookings
  }

  private static async countActiveAccessoryBookings(accessoryId: string): Promise<number> {
    const bookings = await prisma.booking.count({
      where: {
        AND: [
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { accessories: { some: { accessoryId } } }
        ]
      }
    })
    return bookings
  }

  private static async countActiveEquipmentBookings(equipmentId: string): Promise<number> {
    const bookings = await prisma.booking.count({
      where: {
        AND: [
          { status: { in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'] } },
          { equipment: { some: { equipmentId } } }
        ]
      }
    })
    return bookings
  }
}

// Função para executar verificação periódica de locações expiradas
export async function runInventoryMaintenance() {
  try {
    console.log('🚀 Iniciando manutenção completa do estoque...')
    
    // 1. Corrigir status do estoque
    const fixedCount = await InventoryService.fixInventoryStatus()
    console.log(`✅ Status corrigido: ${fixedCount} locações`)
    
    // 2. Verificar locações expiradas
    const expiredCount = await InventoryService.checkExpiredBookings()
    console.log(`✅ Expirações processadas: ${expiredCount} locações`)
    
    console.log(`🎉 Manutenção de estoque concluída. Total: ${fixedCount + expiredCount} operações`)
    return { fixed: fixedCount, expired: expiredCount }
  } catch (error) {
    console.error('❌ Erro na manutenção de estoque:', error)
    throw error
  }
}
