import { FullPlayer } from '../models/FullPlayer'
import { Team } from '../models/Team'
import { HLTVConfig } from '../config'
import { fetchPage, generateRandomSuffix, toArray } from '../utils/mappers'
import { popSlashSource } from '../utils/parsing'
import { checkForRateLimiting } from '../utils/checkForRateLimiting'

export const getPlayer = (config: HLTVConfig) => async ({
  id
}: {
  id: number
}): Promise<FullPlayer> => {
  const $ = await fetchPage(
    `${config.hltvUrl}/player/${id}/${generateRandomSuffix()}`,
    config.loadPage
  )

  checkForRateLimiting($)

  const isStandardPlayer = $('.standard-box.profileTopBox').length !== 0

  const name = isStandardPlayer
    ? $('.player-realname').text().trim() || undefined
    : $('.playerRealname').text().trim() || undefined

  const ign = isStandardPlayer
    ? $('.player-nick').text()
    : $('.playerNickname').text()

  const image = isStandardPlayer
    ? $('.bodyshot-img-square').attr('src')
    : $('.bodyshot-img').attr('src')

  const age = isStandardPlayer
    ? Number($('.profile-player-stat-value').first().text().split(' ')[0]) ||
      undefined
    : Number($('.playerAge .listRight').text().split(' ')[0]) || undefined

  const twitter = $('.twitter').parent().attr('href')
  const twitch = $('.twitch').parent().attr('href')
  const facebook = $('.facebook').parent().attr('href')
  const instagram = $('.instagram').parent().attr('href')

  const country = isStandardPlayer
    ? {
        name: $('.player-realname .flag').attr('alt')!,
        code: popSlashSource($('.player-realname .flag'))!.split('.')[0]
      }
    : {
        name: $('.playerRealname .flag').attr('alt')!,
        code: popSlashSource($('.playerRealname .flag'))!.split('.')[0]
      }

  let team: Team | undefined

  const hasTeam = isStandardPlayer
    ? $('span.profile-player-stat-value').last().text().trim() !== '-'
    : $('.playerTeam .listRight').text().trim() !== 'No team'

  if (hasTeam) {
    if (isStandardPlayer) {
      team = {
        name: $('.profile-player-stat-value a').text().trim(),
        id: Number(
          $('.profile-player-stat-value a').attr('href')!.split('/')[2]
        )
      }
    } else {
      team = {
        name: $('.playerTeam a').text().trim(),
        id: Number($('.playerTeam a').attr('href')!.split('/')[2])
      }
    }
  }

  const getMapStat = (i) =>
    Number(
      $($('.playerpage-container').find('.player-stat').get(i))
        .find('.statsVal')
        .text()
        .replace('%', '')
    )

  const statistics = {
    rating: getMapStat(0),
    killsPerRound: getMapStat(1),
    headshots: getMapStat(2),
    mapsPlayed: getMapStat(3),
    deathsPerRound: getMapStat(4),
    roundsContributed: getMapStat(5)
  }

  const achievements = toArray($('.achievement-table .team')).map((achEl) => ({
    place: achEl.find('.achievement').text(),
    event: {
      name: achEl.find('.tournament-name-cell a').text(),
      id: Number(
        achEl.find('.tournament-name-cell a').attr('href')!.split('/')[2]
      )
    }
  }))

  return {
    id,
    name,
    ign,
    image,
    age,
    twitter,
    twitch,
    facebook,
    instagram,
    country,
    team,
    statistics,
    achievements
  }
}
