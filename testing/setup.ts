import { vi } from 'vitest'



export const projectPathMock = '/home/user/project'

vi.mock('../src/config/projectPath', () => ({
  projectPath: projectPathMock,
}))
