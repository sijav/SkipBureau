import { setProjectAnnotations } from '@storybook/react-vite'
import { beforeAll } from 'vitest'
import * as preview from './preview'

const annotations = setProjectAnnotations([preview])

beforeAll(annotations.beforeAll)
