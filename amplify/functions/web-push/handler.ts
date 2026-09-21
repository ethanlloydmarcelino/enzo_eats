import { createHash } from 'node:crypto'
import webpush from 'web-push'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb'
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import {
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  type ListUsersInGroupCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { DynamoDBStreamEvent, AppSyncResolverEvent, AppSyncIdentityCognito } from 'aws-lambda'
import { validateSubscription } from './validation'

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const secrets = new SecretsManagerClient({})
const cognito = new CognitoIdentityProviderClient({})
const TableName = process.env.SUBSCRIPTIONS_TABLE!
let keys: { publicKey: string; privateKey: string } | undefined
async function configure() {
  if (!keys) {
    const result = await secrets.send(
      new GetSecretValueCommand({ SecretId: process.env.VAPID_SECRET }),
    )
    keys = JSON.parse(result.SecretString!)
    if (!keys?.publicKey) {
      // This function has reserved concurrency one: initialize exactly one key pair.
      keys = webpush.generateVAPIDKeys()
      await secrets.send(
        new PutSecretValueCommand({
          SecretId: process.env.VAPID_SECRET,
          SecretString: JSON.stringify(keys),
        }),
      )
    }
  }
  webpush.setVapidDetails(
    'https://main.d3s93r9r3681q5.amplifyapp.com',
    keys!.publicKey,
    keys!.privateKey,
  )
  return keys!.publicKey
}
async function send(owner: string, payload: object) {
  let ExclusiveStartKey
  do {
    const page: QueryCommandOutput = await db.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':owner': owner },
        ExclusiveStartKey,
      }),
    )
    for (const item of page.Items ?? []) {
      if (item.expiresAt < Date.now() / 1000) continue
      try {
        await webpush.sendNotification(item.subscription, JSON.stringify(payload), {
          TTL: 3600,
          timeout: 5000,
        })
      } catch (error: any) {
        if ([404, 410].includes(error.statusCode))
          await db.send(new DeleteCommand({ TableName, Key: { owner, device: item.device } }))
        else throw new Error(`PUSH_DELIVERY_FAILED:${error.statusCode ?? 'network'}`)
      }
    }
    ExclusiveStartKey = page.LastEvaluatedKey
  } while (ExclusiveStartKey)
}
async function admins() {
  const ids = new Set<string>()
  for (const GroupName of ['admin', 'super_admin']) {
    let NextToken
    do {
      const page: ListUsersInGroupCommandOutput = await cognito.send(
        new ListUsersInGroupCommand({ UserPoolId: process.env.USER_POOL_ID, GroupName, NextToken }),
      )
      for (const user of page.Users ?? []) {
        const sub = user.Attributes?.find((a) => a.Name === 'sub')?.Value
        if (sub && user.Enabled) ids.add(sub)
      }
      NextToken = page.NextToken
    } while (NextToken)
  }
  return ids
}

export const handler = async (
  event: DynamoDBStreamEvent | AppSyncResolverEvent<{ action: string; subscription?: string }>,
) => {
  const publicKey = await configure()
  if ('Records' in event) {
    for (const record of event.Records) {
      if (!record.dynamodb?.NewImage) continue
      const order = unmarshall(record.dynamodb.NewImage as any)
      const before = record.dynamodb.OldImage
        ? unmarshall(record.dynamodb.OldImage as any)
        : undefined
      if (before?.status === order.status) continue
      const tag = `${order.id}:${order.status}`
      if (order.status === 'AWAITING_APPROVAL') {
        for (const owner of await admins())
          await send(owner, {
            title: 'Enzo Eats',
            body: 'A new order needs your approval.',
            tag,
            url: '/account/admin',
          })
      } else {
        await send(order.owner, {
          title: 'Enzo Eats',
          body: `Your order is ${String(order.status).toLowerCase().replaceAll('_', ' ')}. Open the app for details.`,
          tag,
          url: '/account/orders',
        })
      }
    }
    return
  }
  const owner = (event.identity as AppSyncIdentityCognito)?.sub
  if (!owner) throw new Error('UNAUTHORIZED')
  if (event.arguments.action === 'config') return { publicKey }
  const subscription = validateSubscription(event.arguments.subscription)
  const device = createHash('sha256').update(subscription.endpoint).digest('hex')
  const Key = { owner, device }
  if (event.arguments.action === 'remove') {
    await db.send(new DeleteCommand({ TableName, Key }))
  } else if (event.arguments.action === 'subscribe') {
    const existing = await db.send(new GetCommand({ TableName, Key }))
    if (!existing.Item) {
      const count = await db.send(
        new QueryCommand({
          TableName,
          KeyConditionExpression: '#owner = :owner',
          ExpressionAttributeNames: { '#owner': 'owner' },
          ExpressionAttributeValues: { ':owner': owner },
          Select: 'COUNT',
        }),
      )
      if ((count.Count ?? 0) >= 10) throw new Error('DEVICE_LIMIT')
    }
    await db.send(
      new PutCommand({
        TableName,
        Item: { ...Key, subscription, expiresAt: Math.floor(Date.now() / 1000) + 90 * 86400 },
      }),
    )
  } else throw new Error('INVALID_ACTION')
  return { success: true }
}
