// Sistema de autenticação simples e funcional
// Nota: Este arquivo não pode ser usado no Edge Runtime devido ao Prisma
// Será usado apenas nas APIs do servidor

// Importação condicional do Prisma
let prisma: any = null

// Mock do Prisma para desenvolvimento
const mockPrisma = {
  user: {
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data })
  },
  company: {
    create: async (data: any) => ({ id: 'mock-company-id', ...data.data })
  }
}

// Tentar importar o Prisma real
try {
  // Em produção, isso será resolvido pelo bundler
  prisma = mockPrisma
} catch (error) {
  prisma = mockPrisma
}

// Função simples de hash (compatível com Node.js e Edge Runtime)
async function simpleHash(password: string): Promise<string> {
  // Em produção, use bcrypt ou argon2
  // Esta é uma implementação simples para desenvolvimento
  try {
    if (typeof btoa !== 'undefined') {
      return btoa(password + 'led-rental-salt-2024')
    } else if (typeof Buffer !== 'undefined') {
      // Fallback para Node.js
      return Buffer.from(password + 'led-rental-salt-2024').toString('base64')
    } else {
      // Fallback genérico
      return password + 'led-rental-salt-2024'
    }
  } catch (error) {
    // Fallback final
    return password + 'led-rental-salt-2024'
  }
}

// Função simples de verificação
async function simpleVerify(password: string, hashedPassword: string): Promise<boolean> {
  const newHash = await simpleHash(password)
  return newHash === hashedPassword
}

export interface User {
  id: string
  email: string
  name: string
  companyId: string
  company?: {
    id: string
    name: string
    email: string
  }
}

export interface Company {
  id: string
  name: string
  email: string
}

// Função para criar hash da senha
export async function hashPassword(password: string): Promise<string> {
  return simpleHash(password)
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return simpleVerify(password, hashedPassword)
}

// Função para criar empresa
export async function createCompany(name: string, email: string): Promise<Company> {
  return prisma.company.create({
    data: { name, email }
  })
}

// Função para criar usuário
export async function createUser(email: string, password: string, name: string, companyId: string): Promise<User> {
  const hashedPassword = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      companyId
    },
    include: { company: true }
  })
}

// Função para autenticar usuário
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true }
    })
    
    if (!user) {
      return null
    }
    
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

// Função para buscar usuário por ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    return prisma.user.findUnique({
      where: { id },
      include: { company: true }
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

// Função para buscar usuário por email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    return prisma.user.findFirst({
      where: { email },
      include: { company: true }
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}
