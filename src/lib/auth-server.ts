// Sistema de autenticação para servidor (não Edge Runtime)
import { prisma } from './db'
import bcrypt from 'bcryptjs'

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
  return bcrypt.hash(password, 12)
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
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
